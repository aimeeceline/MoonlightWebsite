using DiscountService.Model;
using DiscountService.Repository;
using Microsoft.AspNetCore.Mvc;

namespace DiscountService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DiscountController : Controller
    {
        private readonly DiscountRepository _discountRepo;

        public DiscountController()
        {
            // Giữ nguyên cách khởi tạo cũ để không vỡ DI sẵn có
            _discountRepo = new DiscountRepository();
        }

        // GET /api/Discount/all  (giữ nguyên)
        [HttpGet("all")]
        public IActionResult Get()
        {
            var discounts = _discountRepo.GetAll();
            return Ok(discounts);
        }

        // POST /api/Discount/Create-discount  (giữ nguyên, siết duplicate code)
        [HttpPost("Create-discount")]
        public IActionResult Post([FromBody] Discount discount)
        {
            var code = (discount.Code ?? string.Empty).Trim().ToUpperInvariant();
            discount.Code = code;

            var existingDiscount = _discountRepo.GetAll().FirstOrDefault(d => d.Code == code);
            if (existingDiscount != null)
                return BadRequest(new { message = "Mã khuyến mãi đã tồn tại!" });

            _discountRepo.Insert(discount);
            return CreatedAtAction(nameof(Get), new { id = discount.DiscountId }, discount);
        }
        [HttpPost("apply")]
        public IActionResult Apply([FromBody] ApplyDiscountRequest req) => ApplyDiscount(req);
        // ✅ POST /api/Discount/apply-discount  (VALIDATE) — CartService gọi endpoint này
        // Body: { "code": "ABC", "orderTotal": 123000 }
        [HttpPost("apply-discount")]
        public IActionResult ApplyDiscount([FromBody] ApplyDiscountRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Code))
                return BadRequest("Thiếu code.");
            if (request.OrderTotal < 0)
                return BadRequest("OrderTotal không hợp lệ.");

            var code = request.Code.Trim().ToUpperInvariant();
            var discount = _discountRepo.GetByCode(code);
            if (discount == null)
                return NotFound("Mã giảm giá không tồn tại.");

            // Validate trạng thái/hiệu lực/ngưỡng tối thiểu
            if (!discount.Status)
                return BadRequest("Mã giảm giá đã bị vô hiệu hóa.");

            var now = DateTime.Now;
            if (discount.DateStart.HasValue && now < discount.DateStart.Value)
                return BadRequest("Mã giảm giá chưa bắt đầu.");
            if (discount.ExpirationDate.HasValue && now > discount.ExpirationDate.Value)
                return BadRequest("Mã giảm giá đã hết hạn.");

            var minOrder = discount.MinOrderValue ?? 0m;
            if (request.OrderTotal < minOrder)
                return BadRequest($"Đơn hàng cần tối thiểu {minOrder} để áp dụng mã.");

            // Giá trị giảm: hiện DB đang lưu tỉ lệ % (decimal(5,2))
            var rate = discount.DiscountValue ?? 0m;
            if (rate <= 0 || rate > 100)
                return BadRequest("Mã giảm giá không hợp lệ (tỉ lệ giảm phải 0–100%).");

            var discountAmount = Math.Round(request.OrderTotal * rate / 100m, 2, MidpointRounding.AwayFromZero);
            var final = Math.Max(0, request.OrderTotal - discountAmount);

            return Ok(new
            {
                OriginalTotal = request.OrderTotal,
                DiscountAmount = discountAmount,
                FinalTotal = final,
                DiscountCode = code
            });
        }

        // ✅ NEW: POST /api/Discount/use-discount  — OrderService gọi khi đơn đã tạo thành công
        // Body: { "code": "ABC", "userId": 123, "orderId": 456, "discountAmount": 7890 }
        public class UseDiscountRequest
        {
            public string Code { get; set; } = string.Empty;
            public int? UserId { get; set; }
            public int? OrderId { get; set; }
            public decimal? DiscountAmount { get; set; }
        }

        [HttpPost("use-discount")]
        public IActionResult UseDiscount([FromBody] UseDiscountRequest req)
        {
            if (req == null || string.IsNullOrWhiteSpace(req.Code))
                return BadRequest("Thiếu code.");
            var code = req.Code.Trim().ToUpperInvariant();

            var discount = _discountRepo.GetByCode(code);
            if (discount == null)
                return NotFound("Mã giảm giá không tồn tại.");

            // Ghi nhận 1 dòng usage (đơn giản) — có thể mở rộng limit/user về sau
            var ctx = new DiscountDBContext();
            ctx.DiscountUsages.Add(new DiscountUsage
            {
                DiscountId = discount.DiscountId,
                UserId = req.UserId,
                OrderId = req.OrderId,
                DateUsed = DateTime.Now
            });
            ctx.SaveChanges();

            return Ok(new
            {
                message = "Đã ghi nhận sử dụng mã.",
                DiscountCode = code,
                req.UserId,
                req.OrderId,
                Amount = req.DiscountAmount ?? 0
            });
        }

        // GET /api/Discount/get-discount/{id}  (giữ nguyên)
        [HttpGet("get-discount/{discountId}")]
        public IActionResult Get(int discountId)
        {
            var discount = _discountRepo.GetById(discountId);
            if (discount == null) return NotFound(new { message = "Không tìm thấy mã giảm giá." });
            return Ok(discount);
        }

        // PUT /api/Discount/Update-discount/{id}  (giữ nguyên)
        [HttpPut("Update-discount/{discountId}")]
        public IActionResult Put(int discountId, [FromBody] Discount updated)
        {
            var existing = _discountRepo.GetById(discountId);
            if (existing == null) return NotFound(new { message = "Không tìm thấy mã giảm giá." });

            existing.Code = (updated.Code ?? "").Trim().ToUpperInvariant();
            existing.Description = updated.Description;
            existing.DiscountValue = updated.DiscountValue;
            existing.MinOrderValue = updated.MinOrderValue;
            existing.DateStart = updated.DateStart;
            existing.ExpirationDate = updated.ExpirationDate;
            existing.Status = updated.Status;
            existing.CreateDate = updated.CreateDate;

            _discountRepo.Update(existing);
            return Ok(new { message = "Cập nhật thành công.", discount = existing });
        }

        // DELETE /api/Discount/Delete-discount/{id}  (giữ nguyên)
        [HttpDelete("Delete-discount/{id}")]
        public IActionResult Delete(int id)
        {
            var discount = _discountRepo.GetById(id);
            if (discount == null) return NotFound(new { message = "Không tìm thấy mã giảm giá." });

            _discountRepo.Delete(id);
            return Ok(new { message = "Xóa mã giảm giá thành công." });
        }
    }
}
