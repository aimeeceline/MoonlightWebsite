using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using PaymentService.Model;
using PaymentService.Repository;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text.Json;

namespace PaymentService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentController : Controller
    {
        private readonly PaymentRepository _paymentRepo;
        private readonly IHttpClientFactory _httpFactory;
        private readonly IOptions<ServiceUrls> _svc;
        private readonly IOptions<PaymentSettings> _pay;

        public PaymentController(IHttpClientFactory httpFactory, IOptions<ServiceUrls> svc, IOptions<PaymentSettings> pay)
        {
            _paymentRepo = new PaymentRepository(); // giữ cách khởi tạo cũ để không vỡ code cũ
            _httpFactory = httpFactory;
            _svc = svc;
            _pay = pay;
        }

        // --- Helpers ---
        private int GetUserId()
        {
            var s = User.FindFirstValue(ClaimTypes.NameIdentifier)
                 ?? User.FindFirstValue("uid")
                 ?? User.FindFirstValue("sub");
            return int.TryParse(s, out var id) ? id : 0;
        }

        private string BuildVietQrUrl(decimal amount, string description)
        {
            var bank = _pay.Value.BankCode ?? "970418";
            var acc = _pay.Value.AccountNumber ?? "962470356635602";
            string encodedAmount = Uri.EscapeDataString(amount.ToString("0.00"));
            string encodedDes = Uri.EscapeDataString(description);
            string encodedBank = Uri.EscapeDataString(bank);
            string encodedAcc = Uri.EscapeDataString(acc);
            return $"https://qr.sepay.vn/img?acc={encodedAcc}&bank={encodedBank}&amount={encodedAmount}&des={encodedDes}";
        }

        private async Task<(bool ok, string? refNumber, string status)> PollSepayAsync(Payment payment)
        {
            // đọc config
            var baseUrl = _pay.Value.SepayApiBase ?? "https://my.sepay.vn";
            var token = _pay.Value.SepayApiToken;
            if (string.IsNullOrWhiteSpace(token))
                return (false, null, "NoToken");

            var client = _httpFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var url = $"{baseUrl.TrimEnd('/')}/userapi/transactions/list";
            using var resp = await client.GetAsync(url);
            if (!resp.IsSuccessStatusCode) return (false, null, "Error");

            var raw = await resp.Content.ReadAsStringAsync();
            var doc = JsonDocument.Parse(raw);
            if (!doc.RootElement.TryGetProperty("transactions", out var arr) || arr.ValueKind != JsonValueKind.Array)
                return (false, null, "NoData");

            foreach (var t in arr.EnumerateArray())
            {
                var code = t.TryGetProperty("code", out var c) ? c.GetString() : null;
                var amt = t.TryGetProperty("amount_in", out var a) ? a.ToString() : null;
                var refn = t.TryGetProperty("reference_number", out var r) ? r.GetString() : null;

                if (code == payment.OrderCode && decimal.TryParse(amt, out var money))
                {
                    if (money == payment.TotalPrice)
                        return (true, refn, "Completed");
                }
            }

            return (true, null, "Pending");
        }

        // =============== API ===============

        /// <summary>
        /// Tạo payment VietQR cho đơn mới nhất của user (dựa vào OrderService /api/Order/my).
        /// Body: { "totalPrice": 123000, "note": "..." }
        /// </summary>
        [Authorize(Policy = "ActiveUser")]
        [HttpPost("process-payment")]
        public async Task<IActionResult> ProcessPayment([FromBody] QRRequestModel paymentRequest)
        {
            int userId = GetUserId();
            if (userId <= 0) return Unauthorized("Thiếu userId.");
            if (paymentRequest == null || paymentRequest.TotalPrice <= 0)
                return BadRequest("Số tiền không hợp lệ.");

            // gọi OrderService để lấy đơn mới nhất
            var client = _httpFactory.CreateClient();
            var orderBase = _svc.Value.OrderService ?? "http://orderservice-dev:8080";
            var urlMy = $"{orderBase.TrimEnd('/')}/api/Order/my";

            // forward bearer
            var authHeader = Request.Headers.Authorization.ToString();
            if (!string.IsNullOrWhiteSpace(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                client.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue("Bearer", authHeader.Substring("Bearer ".Length).Trim());
            }

            using var res = await client.GetAsync(urlMy);
            if (!res.IsSuccessStatusCode)
                return StatusCode((int)res.StatusCode, "Không thể kết nối OrderService.");

            var listJson = await res.Content.ReadAsStringAsync();
            var orders = JsonSerializer.Deserialize<List<dynamic>>(listJson,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new();

            // chọn đơn mới nhất theo CreatedDate
            var latest = orders.OrderByDescending(o => (DateTime?)o?.CreatedDate ?? DateTime.MinValue).FirstOrDefault();
            if (latest is null || latest.OrderId is null)
                return BadRequest("Không tìm thấy đơn hàng để tạo QR.");

            int orderId = (int)latest.OrderId;
            string orderCode = $"DH{orderId:D6}";
            string note = string.IsNullOrWhiteSpace(paymentRequest.Note)
                ? $"Thanh toán cho đơn hàng {orderCode}"
                : paymentRequest.Note;

            // QR URL
            string qrCodeUrl = BuildVietQrUrl(paymentRequest.TotalPrice, note);
            DateTime expire = DateTime.UtcNow.AddSeconds(Math.Max(30, _pay.Value.QrExpireSeconds));

            // upsert payment pending cho user
            var existing = _paymentRepo.GetPendingPaymentByUserId(userId);
            string newTxn = Guid.NewGuid().ToString("N");

            if (existing is null || existing.Status == "Completed")
            {
                var p = new Payment
                {
                    UserId = userId,
                    OrderId = orderId,
                    OrderCode = orderCode,
                    PaymentMethod = "VietQR",
                    PaymentDate = DateTime.UtcNow,   // thời điểm tạo phiên
                    TransactionId = newTxn,
                    ReferenceNumber = null,
                    TotalPrice = paymentRequest.TotalPrice,
                    Status = "Pending",
                    CreatedAt = DateTime.UtcNow,
                    ExpirationTime = expire,
                    Description = $"QR Code URL: {qrCodeUrl}",
                    Note = note
                };
                _paymentRepo.Insert(p);
                return Ok(new { paymentId = p.PaymentId, transactionId = p.TransactionId, qrCodeUrl, expirationTime = expire });
            }
            else
            {
                existing.TransactionId = newTxn;
                existing.OrderId = orderId;
                existing.OrderCode = orderCode;
                existing.TotalPrice = paymentRequest.TotalPrice;
                existing.Description = $"QR Code URL: {qrCodeUrl}";
                existing.Status = "Pending";
                existing.PaymentDate = DateTime.UtcNow;
                existing.ExpirationTime = expire;
                existing.ReferenceNumber = null;
                _paymentRepo.Update(existing);

                return Ok(new { paymentId = existing.PaymentId, transactionId = existing.TransactionId, qrCodeUrl, expirationTime = expire });
            }
        }

        /// <summary>
        /// Kiểm tra trạng thái payment theo paymentId; nếu Completed, cập nhật trường ReferenceNumber/PaymentDate.
        /// </summary>
        [Authorize(Policy = "ActiveUser")]
        [HttpGet("check-payment")]
        public async Task<IActionResult> CheckPaymentStatus([FromQuery] int paymentId)
        {
            if (paymentId <= 0) return BadRequest("PaymentId không hợp lệ.");
            var payment = _paymentRepo.GetById(paymentId);
            if (payment is null) return NotFound("Không tìm thấy giao dịch.");

            var (ok, refNo, status) = await PollSepayAsync(payment);
            if (!ok) return StatusCode(502, "Không thể gọi SEPay.");

            if (status == "Completed" && payment.Status != "Completed")
            {
                payment.Status = "Completed";
                payment.ReferenceNumber = refNo;
                payment.PaymentDate = DateTime.UtcNow;
                _paymentRepo.Update(payment);

                // TODO: (khuyên) gọi OrderService cập nhật PaymentStatus = "Paid"
                // var orderBase = _svc.Value.OrderService ?? "...";
                // await client.PutAsJsonAsync($"{orderBase}/api/Order/update-info/{payment.OrderId}", new { PaymentStatus = "Paid" });
            }

            return Ok(new
            {
                paymentId = payment.PaymentId,
                orderCode = payment.OrderCode,
                transactionId = payment.TransactionId,
                referenceNumber = payment.ReferenceNumber,
                status = payment.Status
            });
        }

        /// <summary>
        /// Kiểm tra payment mới nhất của user đang đăng nhập.
        /// </summary>
        [Authorize(Policy = "ActiveUser")]
        [HttpGet("check-payment-by-user")]
        public async Task<IActionResult> CheckPaymentByUser()
        {
            int userId = GetUserId();
            if (userId <= 0) return Unauthorized();

            var payment = _paymentRepo.GetLatestPaymentByUserId(userId);
            if (payment is null) return NotFound("Không tìm thấy giao dịch.");

            var (ok, refNo, status) = await PollSepayAsync(payment);
            if (!ok) return StatusCode(502, "Không thể gọi SEPay.");

            if (status == "Completed" && payment.Status != "Completed")
            {
                payment.Status = "Completed";
                payment.ReferenceNumber = refNo;
                payment.PaymentDate = DateTime.UtcNow;
                _paymentRepo.Update(payment);
            }

            return Ok(new
            {
                paymentId = payment.PaymentId,
                orderId = payment.OrderId,
                status = payment.Status,
                totalPrice = payment.TotalPrice,
                transactionStatus = status
            });
        }
    }
}
