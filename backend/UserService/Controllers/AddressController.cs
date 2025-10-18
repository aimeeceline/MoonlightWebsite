using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UserService.Model;

namespace UserService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Policy = "ActiveUser")] // chỉ user đang hoạt động mới truy cập được
    public class AddressController : ControllerBase
    {
        private readonly UserDBContext _db;
        public AddressController(UserDBContext db) => _db = db;

        // Lấy userId linh hoạt:
        // - Ưu tiên JWT claim (NameIdentifier/sub/uid)
        // - Nếu chưa dùng JWT, nhận từ header: x-user-id
        // - Hoặc query: ?userId=123
        private int GetUserId()
        {
            string? claimId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                              ?? User.FindFirstValue("sub")
                              ?? User.FindFirstValue("uid");

            if (int.TryParse(claimId, out var uidFromClaim) && uidFromClaim > 0)
                return uidFromClaim;

            // Header fallback
            if (Request.Headers.TryGetValue("x-user-id", out var hdr) &&
                int.TryParse(hdr.ToString(), out var uidFromHdr) && uidFromHdr > 0)
                return uidFromHdr;

            // Query fallback
            if (Request.Query.TryGetValue("userId", out var qs) &&
                int.TryParse(qs.ToString(), out var uidFromQs) && uidFromQs > 0)
                return uidFromQs;

            return 0; // chưa xác định được
        }

        // GET /api/Address/list
        [HttpGet("list")]
        public async Task<IActionResult> GetList()
        {
            int userId = GetUserId();
            if (userId <= 0) return BadRequest(new { message = "Thiếu userId (JWT/header/query)" });

            var items = await _db.Addresses
                .AsNoTracking()
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.IsDefault)
                .ThenByDescending(a => a.AddressId)
                .Select(a => new
                {
                    addressId = a.AddressId,
                    fullName = a.RecipientName,
                    email = a.Email,        // thêm email
                    phone = a.Phone,
                    address = a.AddressLine,
                    note = a.Note,
                    isDefault = a.IsDefault
                })
                .ToListAsync();

            return Ok(new { addresses = items });
        }

        // GET /api/Address/default
        [HttpGet("default")]
        public async Task<IActionResult> GetDefault()
        {
            int userId = GetUserId();
            if (userId <= 0) return Ok(new { }); // FE handle rỗng

            var a = await _db.Addresses
                .AsNoTracking()
                .Where(x => x.UserId == userId && x.IsDefault)
                .OrderByDescending(x => x.AddressId)
                .FirstOrDefaultAsync();

            if (a == null) return Ok(new { }); // FE đang handle {}
            return Ok(new
            {
                addressId = a.AddressId,
                fullName = a.RecipientName,
                email = a.Email,        // thêm email
                phone = a.Phone,
                address = a.AddressLine,
                note = a.Note,
                isDefault = a.IsDefault
            });
        }

        public class CreateAddressDto
        {
            public string? FullName { get; set; }
            public string? Phone { get; set; }
            public string? Email { get; set; }   // giữ nguyên field này và BẮT ĐẦU lưu xuống DB
            public string? Address { get; set; }
            public string? Note { get; set; }
            public bool IsDefault { get; set; }
            public int? UserId { get; set; }     // tuỳ chọn: nếu FE muốn gửi userId thẳng
        }

        // POST /api/Address/create
        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] CreateAddressDto dto)
        {
            int userId = dto.UserId.GetValueOrDefault();
            if (userId <= 0) userId = GetUserId();
            if (userId <= 0) return BadRequest(new { message = "Thiếu userId (JWT/header/query/body)" });

            if (string.IsNullOrWhiteSpace(dto.FullName) ||
                string.IsNullOrWhiteSpace(dto.Phone) ||
                string.IsNullOrWhiteSpace(dto.Address) ||
                string.IsNullOrWhiteSpace(dto.Email)) // thêm yêu cầu email
            {
                return BadRequest(new { message = "Thiếu fullName/phone/address/email" });
            }

            // Nếu set mặc định, bỏ default cũ (đảm bảo unique default mỗi user)
            if (dto.IsDefault)
            {
                var oldDefaults = await _db.Addresses.Where(a => a.UserId == userId && a.IsDefault).ToListAsync();
                foreach (var od in oldDefaults) od.IsDefault = false;
            }

            var entity = new Address
            {
                UserId = userId,
                RecipientName = dto.FullName.Trim(),
                Email = dto.Email.Trim(),     // LƯU EMAIL
                Phone = dto.Phone.Trim(),
                AddressLine = dto.Address.Trim(),
                Note = string.IsNullOrWhiteSpace(dto.Note) ? null : dto.Note.Trim(),
                IsDefault = dto.IsDefault
            };

            _db.Addresses.Add(entity);
            await _db.SaveChangesAsync();

            return Ok(new { addressId = entity.AddressId });
        }

        // PUT /api/Address/set-default/{addressId}
        [HttpPut("set-default/{addressId:int}")]
        public async Task<IActionResult> SetDefault([FromRoute] int addressId)
        {
            int userId = GetUserId();
            if (userId <= 0) return BadRequest(new { message = "Thiếu userId (JWT/header/query)" });

            var target = await _db.Addresses.FirstOrDefaultAsync(a => a.AddressId == addressId && a.UserId == userId);
            if (target == null) return NotFound(new { message = "Không tìm thấy địa chỉ" });

            // Bỏ default cũ
            var oldDefaults = await _db.Addresses.Where(a => a.UserId == userId && a.IsDefault).ToListAsync();
            foreach (var od in oldDefaults) od.IsDefault = false;

            target.IsDefault = true;
            await _db.SaveChangesAsync();

            return NoContent();
        }
        // DELETE /api/Address/delete/{addressId}
        [HttpDelete("delete/{addressId:int}")]
        public async Task<IActionResult> Delete([FromRoute] int addressId)
        {
            int userId = GetUserId();
            if (userId <= 0) return BadRequest(new { message = "Thiếu userId (JWT/header/query)" });

            var target = await _db.Addresses.FirstOrDefaultAsync(a => a.AddressId == addressId && a.UserId == userId);
            if (target == null) return NotFound(new { message = "Không tìm thấy địa chỉ" });

            bool wasDefault = target.IsDefault;
            _db.Addresses.Remove(target);
            await _db.SaveChangesAsync();

            // Nếu xoá default -> bỏ mặc định (BE có thể chọn auto đặt cái gần nhất làm default tuỳ yêu cầu)
            if (wasDefault)
            {
                var another = await _db.Addresses.Where(a => a.UserId == userId)
                                                 .OrderByDescending(a => a.AddressId)
                                                 .FirstOrDefaultAsync();
                if (another != null)
                {
                    another.IsDefault = true;
                    await _db.SaveChangesAsync();
                }
            }

            return NoContent();
        }
    }
}
