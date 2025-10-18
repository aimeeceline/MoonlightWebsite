using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Json;
using System.Net.Http.Headers;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using OrdersService.Model;

namespace OrdersService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrderController : ControllerBase
    {
        private readonly OrderDBContext _db;
        private readonly IConfiguration _cfg;
        private readonly IHttpClientFactory _httpFactory;
        public OrderController(OrderDBContext db, IConfiguration cfg, IHttpClientFactory httpFactory)
        {
            _db = db;
            _cfg = cfg;
            _httpFactory = httpFactory;
        }

        // === Helpers ===
        private int GetUserId()
        {
            var id = User.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? User.FindFirstValue("uid")
                  ?? User.FindFirstValue("sub");
            return int.TryParse(id, out var uid) ? uid : 0;
        }

        private static decimal Max0(decimal v) => v < 0 ? 0 : v;

        private static void RecalcOrderTotal(Order order)
        {
            var items = order.OrdersItems ?? new List<OrdersItem>();
            var sumLines = items.Sum(i => i.TotalCost ?? 0m);
            var discount = order.Discount ?? 0m;
            var ship = order.Ship ?? 0m;
            order.TotalCost = Max0(sumLines - discount + ship);
        }

        // ========== USER APIs ==========
        // POST /api/Order/create
        [HttpPost("create")]
        [Authorize(Policy = "ActiveUser")]
        public async Task<IActionResult> Create([FromBody] OrderRequestDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Bảo vệ null trước khi Trim()
            if (string.IsNullOrWhiteSpace(dto?.NameReceive)
             || string.IsNullOrWhiteSpace(dto.Phone)
             || string.IsNullOrWhiteSpace(dto.Email)
             || string.IsNullOrWhiteSpace(dto.Address))
                return BadRequest("Thiếu NameReceive/Phone/Email/Address");

            if (dto.Items == null || dto.Items.Count == 0)
                return BadRequest("Danh sách items trống");

            int userId = GetUserId();
            if (userId <= 0) return Unauthorized();

            var order = new Order
            {
                UserId = userId,
                NameReceive = dto.NameReceive.Trim(),
                Phone = dto.Phone.Trim(),
                Email = dto.Email.Trim(),
                Address = dto.Address.Trim(),
                DiscountCode = string.IsNullOrWhiteSpace(dto.DiscountCode) ? null : dto.DiscountCode.Trim(),
                Discount = dto.Discount ?? 0m,
                Ship = dto.Ship ?? 0m,
                PaymentMethod = string.IsNullOrWhiteSpace(dto.PaymentMethod) ? "COD" : dto.PaymentMethod!.Trim(),
                PaymentStatus = string.IsNullOrWhiteSpace(dto.PaymentStatus) ? "Pending" : dto.PaymentStatus!.Trim(),
                Note = string.IsNullOrWhiteSpace(dto.Note) ? null : dto.Note!.Trim(),
                CreatedDate = DateTime.UtcNow,
                Status = "Chờ xác nhận"
            };

            foreach (var x in dto.Items)
            {
                var qty = Math.Max(1, x.Quantity);
                var price = Math.Max(0, x.Price);
                order.OrdersItems.Add(new OrdersItem
                {
                    ProductId = x.ProductId,
                    CategoryName = x.CategoryName,
                    Name = x.Name,
                    ImageProduct = x.ImageProduct,
                    SoLuong = qty,
                    Price = price,
                    TotalCost = price * qty,
                    Note = x.Note,
                    CreatedDate = DateTime.UtcNow
                });
            }

            RecalcOrderTotal(order);
            _db.Orders.Add(order);
            await _db.SaveChangesAsync();

            // (giữ nguyên phần gọi DiscountService như hiện tại)
            return CreatedAtAction(nameof(GetDetail), new { id = order.OrderId }, new { orderId = order.OrderId });
        }

        // GET /api/Order/my
        [HttpGet("my")]
        [Authorize(Policy = "ActiveUser")]
        public async Task<IActionResult> MyOrders()
        {
            int userId = GetUserId();
            if (userId <= 0) return Unauthorized();

            var orders = await _db.Orders.AsNoTracking()
                .Where(o => o.UserId == userId)
                .OrderByDescending(o => o.OrderId)
                .Select(o => new
                {
                    o.OrderId,
                    o.CreatedDate,
                    o.Status,
                    o.TotalCost,
                    o.Discount,
                    o.Ship,
                    o.DiscountCode,
                    o.PaymentMethod,
                    o.PaymentStatus
                })
                .ToListAsync();

            return Ok(orders);
        }

        // GET /api/Order/detail/{id}
        [HttpGet("detail/{id:int}")]
        [Authorize(Policy = "ActiveUser")]
        public async Task<IActionResult> GetDetail(int id)
        {
            int userId = GetUserId();
            if (userId <= 0) return Unauthorized();

            var order = await _db.Orders
                .Include(o => o.OrdersItems)
                .AsNoTracking()
                .FirstOrDefaultAsync(o => o.OrderId == id && o.UserId == userId);

            if (order is null) return NotFound();

            return Ok(new
            {
                order.OrderId,
                order.UserId,
                order.CreatedDate,
                order.Status,
                order.NameReceive,
                order.Phone,
                order.Email,
                order.Address,
                order.Note,
                order.Discount,
                order.Ship,
                order.DiscountCode,
                order.PaymentMethod,
                order.PaymentStatus,
                order.TotalCost,
                items = order.OrdersItems.Select(i => new
                {
                    i.OrderItemId,
                    i.ProductId,
                    i.CategoryName,
                    i.Name,
                    i.ImageProduct,
                    quantity = i.SoLuong,
                    price = i.Price ?? 0m,
                    totalCost = i.TotalCost ?? 0m,
                    i.Note
                }).ToList()
            });
        }

        // POST /api/Order/cancel/{id}
        [HttpPost("cancel/{id:int}")]
        [Authorize(Policy = "ActiveUser")]
        public async Task<IActionResult> Cancel(int id)
        {
            int userId = GetUserId();
            if (userId <= 0) return Unauthorized();

            var order = await _db.Orders.FirstOrDefaultAsync(o => o.OrderId == id && o.UserId == userId);
            if (order is null) return NotFound();

            if (order.Status == "Thành công" || order.Status == "Đang giao")
                return BadRequest("Đơn đang giao/hoàn tất không thể hủy.");

            order.Status = "Đã hủy";
            await _db.SaveChangesAsync();
            return NoContent();
        }

        // ========== ADMIN APIs ==========
        // GET /api/Order/all
        [HttpGet("all")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> All()
        {
            var orders = await _db.Orders
                .AsNoTracking()
                .OrderByDescending(o => o.OrderId)
                .Select(o => new
                {
                    o.OrderId,
                    o.UserId,
                    o.CreatedDate,
                    o.Status,
                    o.TotalCost,
                    o.Discount,
                    o.Ship,
                    o.DiscountCode,
                    o.PaymentMethod,
                    o.PaymentStatus
                }).ToListAsync();

            return Ok(orders);
        }

        // PATCH /api/Order/update-status/{id}
        [HttpPatch("update-status/{id:int}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusRequest req)
        {
            var order = await _db.Orders.FirstOrDefaultAsync(o => o.OrderId == id);
            if (order is null) return NotFound();
            order.Status = req.Status;
            await _db.SaveChangesAsync();
            return NoContent();
        }

        // PUT /api/Order/update-info/{id}
        [HttpPut("update-info/{id:int}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> UpdateInfo(int id, [FromBody] UpdateOrderInfoRequest req)
        {
            var order = await _db.Orders.Include(o => o.OrdersItems).FirstOrDefaultAsync(o => o.OrderId == id);
            if (order is null) return NotFound();

            if (!string.IsNullOrWhiteSpace(req.NameReceive)) order.NameReceive = req.NameReceive!.Trim();
            if (!string.IsNullOrWhiteSpace(req.Phone)) order.Phone = req.Phone!.Trim();
            if (!string.IsNullOrWhiteSpace(req.Email)) order.Email = req.Email!.Trim();
            if (!string.IsNullOrWhiteSpace(req.Address)) order.Address = req.Address!.Trim();
            if (!string.IsNullOrWhiteSpace(req.Note)) order.Note = req.Note!.Trim();

            if (!string.IsNullOrWhiteSpace(req.PaymentMethod)) order.PaymentMethod = req.PaymentMethod!.Trim();
            if (!string.IsNullOrWhiteSpace(req.PaymentStatus)) order.PaymentStatus = req.PaymentStatus!.Trim();

            if (!string.IsNullOrWhiteSpace(req.DiscountCode)) order.DiscountCode = req.DiscountCode!.Trim();
            if (req.Discount.HasValue) order.Discount = Math.Max(0, req.Discount.Value);
            if (req.Ship.HasValue) order.Ship = Math.Max(0, req.Ship.Value);

            RecalcOrderTotal(order);
            await _db.SaveChangesAsync();

            return NoContent();
        }
    }
}
