using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json.Linq;
using PaymentService.Model;
using PaymentService.Repository;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Security.Principal;
using System.Text;
using System.Text.Json;
using System.Web;
using Shared.Contracts; 

namespace PaymentService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentController : Controller
    {
        private readonly PaymentRepository _paymentRepo;
        private readonly ApiClientHelper _apiClientHelper;


        public PaymentController()
        {
            _paymentRepo = new PaymentRepository();
            _apiClientHelper = new ApiClientHelper();
        }

        // Phương thức tạo mã QR
        private string GenerateVietQR(string account, string bank, decimal amount, string description)
        {
            // Mã hóa các tham số
            string encodedAccount = Uri.EscapeDataString(account);
            string encodedBank = Uri.EscapeDataString(bank);
            string encodedAmount = Uri.EscapeDataString(amount.ToString("0.00"));
            string encodedDescription = Uri.EscapeDataString(description);

            // Tạo URL QR theo định dạng của SEPay
            string qrUrl = $"https://qr.sepay.vn/img?acc={encodedAccount}&bank={encodedBank}&amount={encodedAmount}&des={encodedDescription}";

            return qrUrl;
        }
        // Tạo mã QR
        [Authorize(Policy = "UserOnly")]
        [HttpPost("process-payment")]
        public async Task<IActionResult> ProcessPayment([FromBody] QRRequestModel paymentRequest)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
                return Unauthorized("Không tìm thấy thông tin người dùng.");

            int userId = int.Parse(userIdClaim.Value);

            if (paymentRequest == null || paymentRequest.TotalPrice <= 0)
            {
                return BadRequest("Số tiền không hợp lệ.");
            }

            var token = HttpContext.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            if (string.IsNullOrEmpty(token))
            {
                return Unauthorized("Thiếu token xác thực.");
            }

            // Gọi OrderService
            string orderServiceUrl = "https://localhost:7033/api/Order/get-orders";
            string responseString = await _apiClientHelper.GetStringAsync(orderServiceUrl, token);
            Console.WriteLine("Response từ OrderService: " + responseString);

            if (string.IsNullOrEmpty(responseString))
            {
                return StatusCode(500, "Không thể kết nối tới OrderService.");
            }

            var orders = JsonSerializer.Deserialize<List<OrderDto>>(responseString, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            var latestOrder = orders?
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefault();

            if (latestOrder == null)
            {
                return BadRequest("Không tìm thấy đơn hàng để tạo mã QR.");
            }

            string orderCode = $"DH{latestOrder.OrderId}";

            // Tạo mã QR
            string bankCode = "970418";
            string accountNumber = "962470356635602";
            string transactionId = Guid.NewGuid().ToString();
            string note = $"Thanh toán cho đơn hàng {orderCode}";
            string qrCodeUrl = GenerateVietQR(accountNumber, bankCode, paymentRequest.TotalPrice, note);
            DateTime expirationTime = DateTime.Now.AddSeconds(120);

            var existingPayment = _paymentRepo.GetPendingPaymentByUserId(userId);
            if (existingPayment != null)
            {
                if (existingPayment.Status == "Completed")
                {
                    var newPayment = new Payment
                    {
                        UserId = userId,
                        OrderId = latestOrder.OrderId,
                        OrderCode = orderCode,
                        PaymentMethod = "VietQR",
                        PaymentDate = DateTime.Now,
                        TransactionId = transactionId,
                        ReferenceNumber = null,
                        TotalPrice = paymentRequest.TotalPrice,
                        Status = "Pending",
                        CreatedAt = DateTime.Now,
                        ExpirationTime = expirationTime,
                        Description = $"QR Code URL: {qrCodeUrl}",
                        Note= note,
                    };

                    _paymentRepo.Insert(newPayment);

                    return Ok(new
                    {
                        paymentId = newPayment.PaymentId,
                        transactionId = newPayment.TransactionId,
                        qrCodeUrl,
                        expirationTime
                    });
                }
                else
                {
                    existingPayment.TransactionId = transactionId;
                    existingPayment.OrderId = latestOrder.OrderId;
                    existingPayment.OrderCode = orderCode;
                    existingPayment.TotalPrice = paymentRequest.TotalPrice;
                    existingPayment.Description = $"QR Code URL: {qrCodeUrl}";
                    existingPayment.Status = "Pending";
                    existingPayment.PaymentDate = DateTime.Now;
                    existingPayment.ExpirationTime = expirationTime;
                    existingPayment.ReferenceNumber = null;

                    _paymentRepo.Update(existingPayment);

                    return Ok(new
                    {
                        paymentId = existingPayment.PaymentId,
                        transactionId = existingPayment.TransactionId,
                        qrCodeUrl,
                        expirationTime
                    });
                }
            }
            else
            {
                var newPayment = new Payment
                {
                    UserId = userId,
                    OrderId = latestOrder.OrderId,
                    OrderCode = orderCode,
                    PaymentMethod = "VietQR",
                    PaymentDate = DateTime.Now,
                    TransactionId = transactionId,
                    ReferenceNumber = null,
                    TotalPrice = paymentRequest.TotalPrice,
                    Status = "Pending",
                    CreatedAt = DateTime.Now,
                    ExpirationTime = expirationTime,
                    Description = $"QR Code URL: {qrCodeUrl}",
                    Note = note,
                };

                _paymentRepo.Insert(newPayment);

                return Ok(new
                {
                    paymentId = newPayment.PaymentId,
                    transactionId = newPayment.TransactionId,
                    qrCodeUrl,
                    expirationTime
                });
            }
        }


        private async Task<string> GetReferenceNumberAsync(Payment payment)
        {
            string apiUrl = "https://my.sepay.vn/userapi/transactions/list";
            string apiToken = "20PQ9Q1TLJWXE4KEHXSDOCPRPOWUIMXKJDZNNBKHLDLRIAZBVYSYI6FNGEU0A84V"; // Sử dụng biến môi trường hoặc cấu hình để bảo mật token

            using (HttpClient client = new HttpClient())
            {
                client.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiToken}");
                HttpResponseMessage response = await client.GetAsync(apiUrl);

                if (!response.IsSuccessStatusCode)
                {
                    return null;
                }

                string responseData = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<Dictionary<string, object>>(responseData);

                if (result == null || !result.ContainsKey("transactions"))
                {
                    return null;
                }

                var transactions = JsonSerializer.Deserialize<List<Dictionary<string, object>>>(result["transactions"].ToString());
                if (transactions == null || transactions.Count == 0)
                {
                    return null;
                }

                foreach (var transaction in transactions)
                {
                    string? referenceNumber = transaction["reference_number"]?.ToString();
                    string? transactionContent = transaction["transaction_content"]?.ToString();

                    if (transactionContent.Contains(payment.TransactionId) && !string.IsNullOrEmpty(referenceNumber))
                    {
                        return referenceNumber;
                    }
                }

                return null;
            }
        }

        private async Task<string> CheckTransactionStatusAsync(Payment payment)
        {
            string apiUrl = "https://my.sepay.vn/userapi/transactions/list";
            string apiToken = "20PQ9Q1TLJWXE4KEHXSDOCPRPOWUIMXKJDZNNBKHLDLRIAZBVYSYI6FNGEU0A84V"; // Nên đưa vào cấu hình

            using (HttpClient client = new HttpClient())
            {
                client.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiToken}");

                HttpResponseMessage response = await client.GetAsync(apiUrl);
                if (!response.IsSuccessStatusCode)
                {
                    return "Error";
                }

                string responseData = await response.Content.ReadAsStringAsync();

                var result = JsonSerializer.Deserialize<Dictionary<string, object>>(responseData);
                if (result == null || !result.ContainsKey("transactions"))
                {
                    return "No Data";
                }

                var transactionsJson = result["transactions"].ToString();
                var transactions = JsonSerializer.Deserialize<List<Dictionary<string, object>>>(transactionsJson);

                if (transactions == null || transactions.Count == 0)
                {
                    return "No Transactions";
                }

                foreach (var transaction in transactions)
                {
                    string? code = transaction["code"]?.ToString();
                    string? amountInStr = transaction["amount_in"]?.ToString();
                    string? referenceNumber = transaction["reference_number"]?.ToString();

                    if (code == payment.OrderCode && decimal.TryParse(amountInStr, out decimal amount))
                    {
                        if (amount == payment.TotalPrice)
                        {
                            payment.Status = "Completed";
                            payment.ReferenceNumber = referenceNumber;

                            _paymentRepo.Update(payment);
                            return "Completed";
                        }
                    }
                }

                return "Pending";
            }
        }


        [Authorize(Policy = "UserOnly")]
        [HttpGet("check-payment")]
        public async Task<IActionResult> CheckPaymentStatus(int paymentId)
        {
            if (paymentId <= 0)
            {
                return BadRequest("PaymentId không hợp lệ.");
            }

            var payment = _paymentRepo.GetById(paymentId);

            if (payment == null)
            {
                return NotFound("Không tìm thấy giao dịch.");
            }


            string transactionStatus = await CheckTransactionStatusAsync(payment);

            return Ok(new
            {
                paymentId = payment.PaymentId,
                orderCode = payment.OrderCode,
                transactionId = payment.TransactionId,
                referenceNumber = payment.ReferenceNumber,
                status = payment.Status
            });
        }

        [Authorize(Policy = "UserOnly")]
        [HttpGet("check-payment-by-user")]
        public async Task<IActionResult> CheckPaymentByUser()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized("Không tìm thấy thông tin người dùng.");
                }

                int userId = int.Parse(userIdClaim.Value);

                var payment = _paymentRepo.GetLatestPaymentByUserId(userId);

                if (payment == null)
                {
                    return NotFound("Không tìm thấy giao dịch nào.");
                }

                // Kiểm tra trạng thái giao dịch mới nhất
                string transactionStatus = await CheckTransactionStatusAsync(payment);

                return Ok(new
                {
                    paymentId = payment.PaymentId,
                    orderId = payment.OrderId,
                    status = payment.Status,
                    totalPrice = payment.TotalPrice,
                    transactionStatus = transactionStatus
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi: {ex.Message}");
                return StatusCode(500, "Có lỗi xảy ra khi xử lý yêu cầu.");
            }
        }


    }
}
