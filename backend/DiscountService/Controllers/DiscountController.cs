using DiscountService.Model;
using DiscountService.Repository;
using Microsoft.AspNetCore.Mvc;
using System.Transactions;

namespace DiscountService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DiscountController : Controller
    {
        private readonly DiscountRepository _discountRepo;

        public DiscountController()
        {
            _discountRepo= new DiscountRepository();
        }

        [HttpGet("all")]
        public IActionResult Get()
        {
            var discounts = _discountRepo.GetAll();
            return new OkObjectResult(discounts);
        }

        [HttpPost("Create-discount")]
        public IActionResult Post([FromBody] Discount discount)
        {
            // Kiểm tra trùng mã khuyến mãi
            var existingDiscount = _discountRepo.GetAll().FirstOrDefault(d => d.Code == discount.Code);
            if (existingDiscount != null)
            {
                return BadRequest(new { message = "Mã khuyến mãi đã tồn tại!" });
            }
            using (var scope = new TransactionScope())
            {
                _discountRepo.Insert(discount);
                scope.Complete();
                return CreatedAtAction(nameof(Get), new { id = discount.DiscountId }, discount);
            }
        }

        [HttpPost("apply-discount")]
        public IActionResult ApplyDiscount([FromBody] ApplyDiscountRequest request)
        {
            var discount = _discountRepo.GetByCode(request.Code);

            if (discount == null)
                return NotFound("Mã giảm giá không tồn tại.");

            if (!discount.Status)
                return BadRequest("Mã giảm giá đã bị vô hiệu hóa.");

            if (discount.DateStart > DateTime.Now || discount.ExpirationDate < DateTime.Now)
                return BadRequest("Mã giảm giá không còn hiệu lực.");

            if (request.OrderTotal < discount.MinOrderValue)
                return BadRequest($"Đơn hàng cần tối thiểu {discount.MinOrderValue} để áp dụng mã.");

            if (discount.DiscountValue == null)
                return BadRequest("Mã giảm giá không hợp lệ.");

            decimal discountAmount = (request.OrderTotal * (decimal)discount.DiscountValue) / 100;
            decimal newTotal = request.OrderTotal - discountAmount;

            return Ok(new
            {
                OriginalTotal = request.OrderTotal,
                DiscountAmount = discountAmount,
                FinalTotal = newTotal,
                DiscountCode = discount.Code
            });
        }

        [HttpGet("get-discount/{discountId}")]
        public IActionResult Get(int discountId)
        {
            var discount = _discountRepo.GetById(discountId);
            if (discount == null)
            {
                return NotFound(new { message = "Không tìm thấy mã giảm giá." });
            }
            return Ok(discount);
        }

        [HttpPut("Update-discount/{discountId}")]
        public IActionResult Put(int discountId, [FromBody] Discount updatedDiscount)
        {
            var existing = _discountRepo.GetById(discountId);
            if (existing == null)
            {
                return NotFound(new { message = "Không tìm thấy mã giảm giá." });
            }

            // Cập nhật các trường
            existing.Code = updatedDiscount.Code;
            existing.Description = updatedDiscount.Description;
            existing.DiscountValue = updatedDiscount.DiscountValue;
            existing.MinOrderValue = updatedDiscount.MinOrderValue;
            existing.DateStart = updatedDiscount.DateStart;
            existing.ExpirationDate = updatedDiscount.ExpirationDate;
            existing.Status = updatedDiscount.Status;
            existing.CreateDate = updatedDiscount.CreateDate;

            _discountRepo.Update(existing);

            return Ok(new { message = "Cập nhật thành công.", discount = existing });
        }


        [HttpDelete("Delete-discount/{id}")]
        public IActionResult Delete(int id)
        {
            var discount = _discountRepo.GetById(id); 
            if (discount == null)
            {
                return NotFound(new { message = "Không tìm thấy mã giảm giá." });
            }

            _discountRepo.Delete(id); // Nếu dùng repository pattern
            return Ok(new { message = "Xóa mã giảm giá thành công." });
        }

    }
}
