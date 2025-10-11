using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OrdersService.Model;                // OrderDBContext, Order, OrdersItem (entities)
using OrdersService.Repository;           // IOrderRepository<T>, ApiClientHelper
using OrdersService.Services;             // IEmailService
using Shared.Contracts;                   // CreateOrderRequest, UpdateStatusRequest, UpdateOrderInfoRequest, ProductDto, ...
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text.Json;

namespace OrdersService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrderController : ControllerBase
    {
        private readonly OrderDBContext _db;
        private readonly IOrderRepository<Order> _orderRepo;
        private readonly IOrderRepository<OrdersItem> _orderItemRepo;
        private readonly IEmailService _email;
        private readonly ApiClientHelper _api;

        private static readonly JsonSerializerOptions JsonOpts =
            new(JsonSerializerDefaults.Web) { PropertyNameCaseInsensitive = true };

        public OrderController(
            OrderDBContext db,
            IOrderRepository<Order> orderRepo,
            IOrderRepository<OrdersItem> orderItemRepo,
            IEmailService email,
            ApiClientHelper api)
        {
            _db = db;
            _orderRepo = orderRepo;
            _orderItemRepo = orderItemRepo;
            _email = email;
            _api = api;
        }

        // ----------------------------------------------------------
        // Tạo đơn hàng
        // ----------------------------------------------------------
        [Authorize(Policy = "UserOrAdmin")]
        [HttpPost("create-order")]
        public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized("Không tìm thấy thông tin người dùng.");

            int userId = int.Parse(userIdClaim.Value);

            // Nếu đã có đơn Pending thì trả về luôn
            var existingPendingOrder = await _db.Orders
                .Include(o => o.OrdersItems)
                .FirstOrDefaultAsync(o => o.UserId == userId && o.Status == "Pending");

            if (existingPendingOrder != null)
            {
                return Ok(new
                {
                    message = "Bạn đã có đơn hàng đang chờ thanh toán!",
                    orderId = existingPendingOrder.OrderId,
                    discountCode = existingPendingOrder.DiscountCode,
                    totalProductCost = existingPendingOrder.OrdersItems.Sum(i => i.Price * i.SoLuong),
                    discount = existingPendingOrder.Discount,
                    ship = existingPendingOrder.Ship,
                    totalCost = existingPendingOrder.TotalCost
                });
            }

            var status = request.PaymentMethod == "COD" ? "Chờ xác nhận" : "Pending";

            var newOrder = new Order
            {
                UserId = userId,
                CreatedDate = DateTime.Now,
                Status = status,
                Discount = request.Discount ?? 0m,
                Ship = request.Ship ?? 0m,
                DiscountCode = request.DiscountCode,
                TotalCost = 0m,
                OrdersItems = new List<OrdersItem>()
            };

            decimal totalProductCost = 0m;

            foreach (var it in request.Items)
            {
                // Lấy sản phẩm từ ProductService
                var prod = await _api.GetProductByIdAsync(it.ProductId);
                if (prod == null || prod.ProductId <= 0)
                    return BadRequest($"Không lấy được sản phẩm ID {it.ProductId}");

                // Chuẩn hoá dữ liệu hiển thị
                var name = (!string.IsNullOrWhiteSpace(prod.Name) ? prod.Name :
                           !string.IsNullOrWhiteSpace(prod.ProductName) ? prod.ProductName : "-");

                var img = (!string.IsNullOrWhiteSpace(prod.ImageUrl) ? prod.ImageUrl :
                          !string.IsNullOrWhiteSpace(prod.ProductImage) ? prod.ProductImage :
                          !string.IsNullOrWhiteSpace(prod.Image) ? prod.Image : "");

                var price = (prod.Price ?? prod.SalePrice ?? prod.MinPrice) ?? 0m;

                var categoryName = !string.IsNullOrWhiteSpace(prod.CategoryName) ? prod.CategoryName :
                                   (prod.Category?.Name ?? prod.Category?.CategoryName ??
                                    prod.CategoryDto?.Name ?? prod.CategoryDto?.CategoryName ?? "-");

                var lineTotal = price * it.Quantity;
                totalProductCost += lineTotal;

                newOrder.OrdersItems.Add(new OrdersItem
                {
                    ProductId = prod.ProductId,
                    Name = name,
                    ImageProduct = img,
                    Price = price,
                    SoLuong = it.Quantity,
                    TotalCost = lineTotal,
                    CategoryName = categoryName,

                    // thông tin nhận hàng
                    NameReceive = request.NameReceive,
                    Phone = request.Phone,
                    Email = request.Email,
                    Address = request.Address,
                    PaymentMethod = request.PaymentMethod,
                    PaymentStatus = "Chưa thanh toán",
                    Discount = 0m,
                    Ship = 0m,
                    Note = request.Note,
                    CreatedDate = DateTime.Now
                });
            }

            // Tính tổng
            newOrder.TotalCost = Math.Max(0m, totalProductCost - (request.Discount ?? 0m) + (request.Ship ?? 0m));

            _db.Orders.Add(newOrder);
            await _db.SaveChangesAsync();

            // Tuỳ chọn: sau khi tạo đơn có thể dọn giỏ
            // (Bạn có thể đổi URL sang service name trong docker network, ví dụ http://cartservice:8090/...)
            // var bearer = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            // await SendDeleteAsync("http://cartservice:8090/api/Cart/delete-cart", bearer);

            return Ok(new
            {
                message = "Đơn hàng đã tạo thành công!",
                orderId = newOrder.OrderId,
                discountCode = newOrder.DiscountCode,
                totalProductCost,
                discount = newOrder.Discount,
                ship = newOrder.Ship,
                totalCost = newOrder.TotalCost
            });
        }

        // ----------------------------------------------------------
        // Đồng bộ trạng thái thanh toán từ PaymentService
        // ----------------------------------------------------------
        [Authorize(Policy = "UserOrAdmin")]
        [HttpGet("sync-order-payment-status")]
        public async Task<IActionResult> SyncOrderPaymentStatus()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null) return Unauthorized("Không tìm thấy thông tin người dùng.");

                var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
                var paymentUrl = "http://paymentservice:8080/api/Payment/check-payment-by-user"; // đổi đúng host/port nội bộ

                var json = await SendGetAsync(paymentUrl, token);
                if (string.IsNullOrWhiteSpace(json))
                    return BadRequest("Không lấy được thông tin thanh toán.");

                var info = JsonSerializer.Deserialize<PaymentStatusResponse>(json, JsonOpts);
                if (info is { Status: not null } &&
                    info.Status.Equals("Completed", StringComparison.OrdinalIgnoreCase) &&
                    info.OrderId > 0)
                {
                    var order = _orderRepo.GetById(info.OrderId);
                    if (order == null) return NotFound("Không tìm thấy đơn hàng tương ứng.");

                    order.Status = "Completed";
                    _orderRepo.Update(order);

                    var firstEmail = order.OrdersItems.FirstOrDefault()?.Email;
                    if (!string.IsNullOrEmpty(firstEmail))
                    {
                        await _email.SendEmailAsync(
                            firstEmail!,
                            "Xác nhận đơn hàng thành công",
                            $"<h3>Đơn hàng #{order.OrderId}</h3><p>Thanh toán thành công.</p>"
                        );
                    }

                    return Ok("Đã cập nhật trạng thái đơn hàng.");
                }

                return Ok("Giao dịch chưa hoàn tất, không cập nhật trạng thái đơn hàng.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi đồng bộ: {ex.Message}");
            }
        }

        // ----------------------------------------------------------
        // Test gửi email
        // ----------------------------------------------------------
        [HttpGet("test-email")]
        public async Task<IActionResult> TestEmail()
        {
            await _email.SendEmailAsync("test@example.com", "Test Email", "Nội dung test thử");
            return Ok("Email đã được gửi!");
        }

        // ----------------------------------------------------------
        // Kiểm tra đơn Pending của user
        // ----------------------------------------------------------
        [Authorize(Policy = "UserOrAdmin")]
        [HttpGet("pending-order")]
        public async Task<IActionResult> GetPendingOrder()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized("Không tìm thấy thông tin người dùng.");

            int userId = int.Parse(userIdClaim.Value);

            var pending = await _db.Orders
                .Include(o => o.OrdersItems)
                .FirstOrDefaultAsync(o => o.UserId == userId && o.Status == "Pending");

            if (pending == null) return Ok(new { hasPending = false });

            return Ok(new
            {
                hasPending = true,
                orderId = pending.OrderId,
                totalCost = pending.TotalCost,
                createdDate = pending.CreatedDate
            });
        }

        // ----------------------------------------------------------
        // Cập nhật trạng thái đơn
        // ----------------------------------------------------------
        [Authorize(Policy = "UserOrAdmin")]
        [HttpPatch("update-status/{orderId}")]
        public IActionResult UpdateOrderStatus(int orderId, [FromBody] UpdateStatusRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized("Không tìm thấy thông tin người dùng.");

            var order = _orderRepo.GetById(orderId);
            if (order == null) return NotFound("Đơn hàng không tồn tại.");

            var allowed = new[] { "Pending", "Completed", "Cancelled", "Chờ xác nhận" };
            if (!allowed.Contains(request.Status)) return BadRequest("Trạng thái không hợp lệ.");

            order.Status = request.Status;
            _orderRepo.Update(order);

            return Ok(new { message = "Cập nhật trạng thái thành công." });
        }

        // ----------------------------------------------------------
        // Lấy danh sách đơn của user
        // ----------------------------------------------------------
        [Authorize(Policy = "UserOrAdmin")]
        [HttpGet("get-orders")]
        public IActionResult GetOrdersByUser()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized("Không tìm thấy thông tin người dùng.");

            int userId = int.Parse(userIdClaim.Value);

            var orders = _db.Orders
                .Where(o => o.UserId == userId)
                .OrderByDescending(o => o.CreatedDate)
                .Select(o => new
                {
                    o.OrderId,
                    o.CreatedDate,
                    o.Status,
                    o.TotalCost,
                    o.Discount,
                    o.Ship,
                    Items = o.OrdersItems.Select(i => new
                    {
                        i.ProductId,
                        i.Name,
                        i.ImageProduct,
                        i.SoLuong,
                        i.Price,
                        i.TotalCost,
                        i.CategoryName,
                        i.CreatedDate,
                        i.PaymentStatus
                    }).ToList()
                })
                .ToList();

            if (!orders.Any()) return NotFound("Không có đơn hàng nào.");
            return Ok(orders);
        }

        // ----------------------------------------------------------
        // Lấy tất cả đơn (Admin)
        // ----------------------------------------------------------
        [Authorize(Policy = "AdminOnly")]
        [HttpGet("all-order")]
        public IActionResult GetAllOrders()
        {
            var orders = _db.Orders
                .OrderByDescending(o => o.CreatedDate)
                .Select(o => new
                {
                    o.OrderId,
                    o.UserId,
                    Username = "Không xác định",
                    o.CreatedDate,
                    o.Status,
                    o.TotalCost,
                    o.Discount,
                    o.Ship
                })
                .ToList();

            if (!orders.Any()) return NotFound("Không có đơn hàng nào.");
            return Ok(orders);
        }

        // ----------------------------------------------------------
        // Chi tiết đơn
        // ----------------------------------------------------------
        [Authorize(Policy = "UserOrAdmin")]
        [HttpGet("detail/{orderId}")]
        public IActionResult GetOrderDetail(int orderId)
        {
            var order = _db.Orders
                .Where(o => o.OrderId == orderId)
                .Select(o => new
                {
                    o.OrderId,
                    o.UserId,
                    Username = "Không xác định",
                    o.CreatedDate,
                    o.Status,
                    o.TotalCost,
                    o.Discount,
                    o.DiscountCode,
                    o.Ship,
                    Items = o.OrdersItems.Select(i => new
                    {
                        i.OrderItemId,
                        i.OrderId,
                        i.Phone,
                        i.Email,
                        i.Address,
                        i.ProductId,
                        i.SoLuong,
                        i.Price,
                        i.Discount,
                        i.Ship,
                        i.CreatedDate,
                        i.PaymentMethod,
                        i.PaymentStatus,
                        i.TotalCost,
                        i.Note,
                        i.NameReceive,
                        i.Name,
                        i.ImageProduct,
                        i.CategoryName
                    }).ToList()
                })
                .FirstOrDefault();

            if (order == null) return NotFound("Không tìm thấy đơn hàng.");
            return Ok(order);
        }

        // ----------------------------------------------------------
        // Xoá đơn
        // ----------------------------------------------------------
        [Authorize(Policy = "UserOrAdmin")]
        [HttpDelete("delete/{orderId}")]
        public async Task<IActionResult> DeleteOrder(int orderId)
        {
            var order = await _db.Orders.FindAsync(orderId);
            if (order == null) return NotFound("Không tìm thấy đơn hàng.");

            var items = _db.OrdersItems.Where(i => i.OrderId == orderId).ToList();
            _db.OrdersItems.RemoveRange(items);
            _db.Orders.Remove(order);
            await _db.SaveChangesAsync();

            return Ok($"Đã xoá đơn hàng #{orderId}.");
        }

        // ----------------------------------------------------------
        // Sửa thông tin đơn (Admin)
        // ----------------------------------------------------------
        [Authorize(Policy = "AdminOnly")]
        [HttpPut("update-order-info/{orderId}")]
        public async Task<IActionResult> UpdateOrderInfo(int orderId, [FromBody] UpdateOrderInfoRequest request)
        {
            var order = _db.Orders
                .Include(o => o.OrdersItems)
                .FirstOrDefault(o => o.OrderId == orderId);

            if (order == null) return NotFound("Không tìm thấy đơn hàng.");

            foreach (var item in order.OrdersItems)
            {
                item.Address = request.Address;
                item.Phone = request.Phone;
                item.Email = request.Email;
                item.Note = request.Note;
            }

            order.Status = request.Status;
            await _db.SaveChangesAsync();

            return Ok(new { message = "Cập nhật thông tin đơn hàng thành công!" });
        }

        // ======= Helpers =======
        private static HttpClient CreateInsecureClient()
        {
            var handler = new HttpClientHandler
            {
                ServerCertificateCustomValidationCallback = (msg, cert, chain, errors) => true
            };
            return new HttpClient(handler);
        }

        private static async Task<string> SendGetAsync(string url, string? bearerToken = null)
        {
            using var http = CreateInsecureClient();
            var req = new HttpRequestMessage(HttpMethod.Get, url);
            if (!string.IsNullOrWhiteSpace(bearerToken))
                req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", bearerToken);
            var res = await http.SendAsync(req);
            return res.IsSuccessStatusCode ? await res.Content.ReadAsStringAsync() : "";
        }

        private static async Task SendDeleteAsync(string url, string? bearerToken = null)
        {
            using var http = CreateInsecureClient();
            var req = new HttpRequestMessage(HttpMethod.Delete, url);
            if (!string.IsNullOrWhiteSpace(bearerToken))
                req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", bearerToken);
            await http.SendAsync(req);
        }
    }
}
