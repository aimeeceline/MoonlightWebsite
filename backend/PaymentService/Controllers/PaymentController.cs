using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using PaymentService.Model;
using PaymentService.Repository;
using Shared.Contracts;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;

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
            _paymentRepo = new PaymentRepository();
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

        private string BuildVietQrUrl(decimal amount, string description, string transactionId)
        {
            // DEMO MOCK: tạo link tới trang xác nhận giả lập
            if (_pay.Value.UseMockBank)
            {
                var host = string.IsNullOrWhiteSpace(_pay.Value.PublicBaseUrl)
                    ? "http://localhost:7103"
                    : _pay.Value.PublicBaseUrl!;
                var sec = _pay.Value.MockSecret ?? "devsecret";
                var amt = Uri.EscapeDataString(amount.ToString("0")); // VND integer
                var tx = Uri.EscapeDataString(transactionId);
                var se = Uri.EscapeDataString(sec);
                return $"{host.TrimEnd('/')}/mock-bank/confirm?tx={tx}&sec={se}&amount={amt}";
            }

            // Thực tế (SEPay VietQR)
            var bank = _pay.Value.BankCode ?? "TPBVVNVX";
            var acc = _pay.Value.AccountNumber ?? "0795793509";
            string encodedAmount = Uri.EscapeDataString(amount.ToString("0.00"));
            string encodedDes = Uri.EscapeDataString(description);
            string encodedBank = Uri.EscapeDataString(bank);
            string encodedAcc = Uri.EscapeDataString(acc);
            return $"https://qr.sepay.vn/img?acc={encodedAcc}&bank={encodedBank}&amount={encodedAmount}&des={encodedDes}";
        }

        private async Task<(bool ok, string? refNumber, string status)> PollSepayAsync(Payment payment)
        {
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

        // >>> CHỈNH Ở ĐÂY: dùng _svc và _pay thay vì _configuration
        private async Task NotifyOrderPaidAsync(int orderId)
        {
            var orderBase = _svc.Value.OrderService ?? "http://orderservice-dev:8080";
            var url = $"{orderBase.TrimEnd('/')}/api/Order/{orderId}/payment-callback";

            var client = _httpFactory.CreateClient();

            var secret = _pay.Value.InternalSecret ?? "devsecret";
            client.DefaultRequestHeaders.Add("x-internal-secret", secret);

            var payload = new PaymentStatusResponse
            {
                Status = "Completed",        // => Order sẽ set PaymentStatus = "Paid"
                OrderId = orderId,
                TransactionStatus = "OK",
                Message = "Payment success"
            };

            using var resp = await client.PutAsJsonAsync(url, payload);
            // có thể ghi log nếu muốn
        }

        // =============== API ===============

        [Authorize(Policy = "ActiveUser")]
        [HttpPost("process-payment")]
        public async Task<IActionResult> ProcessPayment([FromBody] QRRequestModel paymentRequest)
        {
            int userId = GetUserId();
            if (userId <= 0) return Unauthorized("Thiếu userId.");
            if (paymentRequest == null || paymentRequest.TotalPrice <= 0)
                return BadRequest("Số tiền không hợp lệ.");

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

            var orders = await res.Content.ReadFromJsonAsync<List<JsonElement>>() ?? new();
            if (orders.Count == 0)
                return BadRequest("Không có đơn hàng nào.");

            var latest = orders
                .OrderByDescending(o =>
                    o.TryGetProperty("createdDate", out var cd) && cd.ValueKind == JsonValueKind.String
                        && DateTime.TryParse(cd.GetString(), out var dt)
                            ? dt
                            : DateTime.MinValue)
                .FirstOrDefault();

            if (latest.ValueKind == JsonValueKind.Undefined)
                return BadRequest("Không tìm thấy đơn hàng để tạo QR.");

            int orderId = latest.GetProperty("orderId").GetInt32();
            decimal totalCost = latest.GetProperty("totalCost").GetDecimal();

            string orderCode = $"DH{orderId:D6}";
            string note = string.IsNullOrWhiteSpace(paymentRequest.Note)
                ? $"Thanh toán cho đơn hàng {orderCode}"
                : paymentRequest.Note;

            // ▶ tạo transactionId trước rồi build QR (mock dùng tx)
            string newTxn = Guid.NewGuid().ToString("N");
            string qrCodeUrl = BuildVietQrUrl(totalCost, note, newTxn);

            var expireCfg = _pay.Value.QrExpireSeconds;
            var expireSeconds = Math.Max(30, expireCfg > 0 ? expireCfg : 120);
            DateTime expire = DateTime.UtcNow.AddSeconds(expireSeconds);

            var existing = _paymentRepo.GetPendingPaymentByUserId(userId);

            if (existing is null || existing.Status == "Completed")
            {
                var p = new Payment
                {
                    UserId = userId,
                    OrderId = orderId,
                    OrderCode = orderCode,
                    PaymentMethod = "VietQR",
                    PaymentDate = DateTime.UtcNow,
                    TransactionId = newTxn,
                    ReferenceNumber = null,
                    TotalPrice = totalCost,
                    Status = "Pending",
                    CreatedAt = DateTime.UtcNow,
                    ExpirationTime = expire,
                    Description = $"QR Code URL: {qrCodeUrl}",
                    Note = note
                };
                _paymentRepo.Insert(p);
                return Ok(new
                {
                    paymentId = p.PaymentId,
                    transactionId = p.TransactionId,
                    qrCodeUrl,
                    expirationTime = expire
                });
            }
            else
            {
                existing.TransactionId = newTxn;
                existing.OrderId = orderId;
                existing.OrderCode = orderCode;
                existing.TotalPrice = totalCost;
                existing.Description = $"QR Code URL: {qrCodeUrl}";
                existing.Status = "Pending";
                existing.PaymentDate = DateTime.UtcNow;
                existing.ExpirationTime = expire;
                existing.ReferenceNumber = null;
                _paymentRepo.Update(existing);

                return Ok(new
                {
                    paymentId = existing.PaymentId,
                    transactionId = existing.TransactionId,
                    qrCodeUrl,
                    expirationTime = expire
                });
            }
        }

        // --- MOCK BANK PAGES / DEV only ---
        [HttpGet("/mock-bank/confirm")]
        [AllowAnonymous]
        public IActionResult MockBankConfirm([FromQuery] string tx, [FromQuery] string sec, [FromQuery] decimal? amount = null)
        {
            var expected = _pay.Value.MockSecret ?? "devsecret";
            if (sec != expected) return Forbid();

            var amountText = amount.HasValue ? $"{amount.Value:N0} VND" : "–";
            var html = $@"
<!doctype html>
<html>
<head>
  <meta charset='utf-8'/>
  <meta name='viewport' content='width=device-width,initial-scale=1' />
  <title>Mock Bank - Confirm</title>
  <style>body{{font-family:Arial;margin:24px}} .box{{max-width:420px;margin:auto;padding:18px;border:1px solid #ddd;border-radius:8px}} button{{padding:10px 16px;border:none;border-radius:6px;background:#0b74de;color:#fff;font-size:16px}} </style>
</head>
<body>
  <div class='box'>
    <h2>Mock Bank - Xác nhận chuyển tiền</h2>
    <p><strong>Số tiền:</strong> {amountText}</p>
    <p><strong>Mã giao dịch (txn):</strong> {tx}</p>
    <form method='post' action='/mock-bank/confirm'>
      <input type='hidden' name='tx' value='{tx}' />
      <input type='hidden' name='sec' value='{sec}' />
      <button type='submit'>Xác nhận chuyển tiền</button>
    </form>
    <p style='color:#666;margin-top:12px;font-size:13px'>Demo: nhấn xác nhận sẽ mark giao dịch là Completed (không chuyển tiền thật).</p>
  </div>
</body>
</html>";
            return Content(html, "text/html");
        }

        [HttpPost("/mock-bank/confirm")]
        [AllowAnonymous]
        public async Task<IActionResult> MockBankConfirmPost([FromForm] string tx, [FromForm] string sec)
        {
            var expected = _pay.Value.MockSecret ?? "devsecret";
            if (sec != expected) return Forbid();

            var payment = _paymentRepo.GetByTransactionId(tx);
            if (payment == null) return NotFound("Không tìm thấy giao dịch demo.");

            payment.Status = "Completed";
            payment.ReferenceNumber = "MOCK" + DateTime.UtcNow.ToString("yyyyMMddHHmmss");
            payment.PaymentDate = DateTime.UtcNow;
            _paymentRepo.Update(payment);

            // >>> GỌI CALLBACK sang OrderService
            await NotifyOrderPaidAsync(payment.OrderId);

            var html = $@"<!doctype html><html><head><meta charset='utf-8'><title>Thanh toán thành công</title></head>
<body style='font-family:Arial;padding:20px;'><h2>Thanh toán thành công ✅</h2><p>Txn: {tx}</p><p>Ref: {payment.ReferenceNumber}</p></body></html>";
            return Content(html, "text/html");
        }

        [Authorize(Policy = "ActiveUser")]
        [HttpGet("check-payment")]
        public async Task<IActionResult> CheckPaymentStatus([FromQuery] int paymentId)
        {
            if (paymentId <= 0) return BadRequest("PaymentId không hợp lệ.");
            var payment = _paymentRepo.GetById(paymentId);
            if (payment is null) return NotFound("Không tìm thấy giao dịch.");

            // Nếu đang mock thì trả trạng thái từ DB luôn (không gọi SEPay)
            if (_pay.Value.UseMockBank)
            {
                // Nếu mock và vừa Completed thì vẫn gọi callback để chắc ăn
                if (payment.Status == "Completed")
                    await NotifyOrderPaidAsync(payment.OrderId);

                return Ok(new
                {
                    paymentId = payment.PaymentId,
                    orderCode = payment.OrderCode,
                    transactionId = payment.TransactionId,
                    referenceNumber = payment.ReferenceNumber,
                    status = payment.Status
                });
            }

            var (ok, refNo, status) = await PollSepayAsync(payment);
            if (!ok) return StatusCode(502, "Không thể gọi SEPay.");

            if (status == "Completed" && payment.Status != "Completed")
            {
                payment.Status = "Completed";
                payment.ReferenceNumber = refNo;
                payment.PaymentDate = DateTime.UtcNow;
                _paymentRepo.Update(payment);

                await NotifyOrderPaidAsync(payment.OrderId);
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

        [Authorize(Policy = "ActiveUser")]
        [HttpGet("check-payment-by-user")]
        public async Task<IActionResult> CheckPaymentByUser()
        {
            int userId = GetUserId();
            if (userId <= 0) return Unauthorized();

            var payment = _paymentRepo.GetLatestPaymentByUserId(userId);
            if (payment is null) return NotFound("Không tìm thấy giao dịch.");

            if (_pay.Value.UseMockBank)
            {
                if (payment.Status == "Completed")
                    await NotifyOrderPaidAsync(payment.OrderId);

                return Ok(new
                {
                    paymentId = payment.PaymentId,
                    orderId = payment.OrderId,
                    status = payment.Status,
                    totalPrice = payment.TotalPrice,
                    transactionStatus = payment.Status
                });
            }

            var (ok, refNo, status) = await PollSepayAsync(payment);
            if (!ok) return StatusCode(502, "Không thể gọi SEPay.");

            if (status == "Completed" && payment.Status != "Completed")
            {
                payment.Status = "Completed";
                payment.ReferenceNumber = refNo;
                payment.PaymentDate = DateTime.UtcNow;
                _paymentRepo.Update(payment);

                await NotifyOrderPaidAsync(payment.OrderId);
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
