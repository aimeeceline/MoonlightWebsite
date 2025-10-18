using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using UserService.Model;

[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly UserDBContext _db;
    public UserController(UserDBContext db) => _db = db;

    // Helper đọc current user id từ token
    private int CurrentUserId()
    {
        var sid = User.FindFirstValue(ClaimTypes.NameIdentifier)
               ?? User.FindFirstValue("uid")
               ?? User.FindFirstValue(ClaimTypes.Name);
        return int.TryParse(sid, out var id) ? id : 0;
    }

    // ========== 0) REGISTER (PUBLIC) ==========
    public class RegisterDto
    {
        [Required, MaxLength(255)] public string Username { get; set; } = string.Empty;
        [Required, MaxLength(255)] public string Password { get; set; } = string.Empty;
        [Required, MaxLength(255), EmailAddress] public string Email { get; set; } = string.Empty;
        [Required, MaxLength(20)] public string Phone { get; set; } = string.Empty;
    }

    // POST /api/User/register  -> user tự đăng ký (không cần token)
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        if (await _db.Users.AnyAsync(u => u.Username == dto.Username))
            return Conflict("Username đã tồn tại.");
        if (await _db.Users.AnyAsync(u => u.Email == dto.Email))
            return Conflict("Email đã tồn tại.");

        var user = new User
        {
            Username = dto.Username.Trim(),
            Password = dto.Password.Trim(), // (dev) plaintext; (prod) hash
            TypeUser = "User",              // luôn là User khi tự đăng ký
            Email = dto.Email.Trim(),
            Phone = dto.Phone.Trim(),
            IsActive = true
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = user.UserId }, new
        {
            user.UserId,
            user.Username,
            user.TypeUser,
            user.Email,
            user.Phone,
            user.IsActive
        });
    }

    // ========== 1) ADMIN – LIST/CREATE/EDIT/DELETE ==========
    // GET /api/User/all  -> chỉ admin xem danh sách
    [HttpGet("all")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> GetAll()
    {
        var users = await _db.Users
            .AsNoTracking()
            .Where(u => u.TypeUser != null && u.TypeUser.ToLower() == "user")
            .Select(u => new
            {
                u.UserId,
                u.Username,
                u.TypeUser,
                u.Email,
                u.Phone,
                IsActive = (bool?)(EF.Property<bool?>(u, "IsActive")) ?? true
            })
            .ToListAsync();

        return Ok(users);
    }

    // POST /api/User/Create (Admin tạo user bất kỳ)
    [HttpPost("Create")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Create([FromBody] User user)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        user.UserId = 0;
        if (await _db.Users.AnyAsync(u => u.Username == user.Username))
            return Conflict("Username đã tồn tại.");
        if (await _db.Users.AnyAsync(u => u.Email == user.Email))
            return Conflict("Email đã tồn tại.");

        // default IsActive = true nếu chưa set
        var prop = user.GetType().GetProperty("IsActive");
        if (prop != null && (prop.GetValue(user) == null))
            prop.SetValue(user, true);

        // nếu admin muốn tạo Admin thì giữ theo body; nếu không cứ để TypeUser hiện tại
        if (string.IsNullOrWhiteSpace(user.TypeUser))
            user.TypeUser = "User";

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = user.UserId }, new
        {
            user.UserId,
            user.Username,
            user.TypeUser,
            user.Email,
            user.Phone,
            IsActive = prop != null ? (bool)prop.GetValue(user)! : true
        });
    }

    // PUT /api/User/Edit/{id} (Admin chỉnh user bất kỳ)
    [HttpPut("Edit/{id:int}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Update(int id, [FromBody] User user)
    {
        if (id != user.UserId) return BadRequest("ID không khớp");

        var entity = await _db.Users.FirstOrDefaultAsync(u => u.UserId == id);
        if (entity is null) return NotFound();

        if (!string.IsNullOrWhiteSpace(user.Password)) entity.Password = user.Password;
        if (!string.IsNullOrWhiteSpace(user.TypeUser)) entity.TypeUser = user.TypeUser!;
        if (!string.IsNullOrWhiteSpace(user.Email))
        {
            bool dup = await _db.Users.AnyAsync(u => u.Email == user.Email && u.UserId != id);
            if (dup) return Conflict("Email đã tồn tại.");
            entity.Email = user.Email!;
        }
        if (!string.IsNullOrWhiteSpace(user.Phone)) entity.Phone = user.Phone!;

        var prop = entity.GetType().GetProperty("IsActive");
        var incoming = user.GetType().GetProperty("IsActive");
        if (prop != null && incoming != null)
        {
            var incomingVal = incoming.GetValue(user);
            if (incomingVal is bool b) prop.SetValue(entity, b);
        }

        await _db.SaveChangesAsync();
        return Ok(new
        {
            entity.UserId,
            entity.Username,
            entity.TypeUser,
            entity.Email,
            entity.Phone,
            IsActive = prop != null ? (bool)prop.GetValue(entity)! : true
        });
    }

    // DELETE /api/User/Delete/{id} (Admin xoá)
    [HttpDelete("Delete/{id:int}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _db.Users.FindAsync(id);
        if (entity is null) return NotFound();
        _db.Users.Remove(entity);
        await _db.SaveChangesAsync();
        return Ok();
    }

    // PUT /api/User/toggle-active/{id}?active=true|false (Admin khoá/mở)
    [HttpPut("toggle-active/{id:int}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> ToggleActive(int id, [FromQuery] bool active)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == id);
        if (user is null) return NotFound();
        var prop = user.GetType().GetProperty("IsActive");
        if (prop != null) prop.SetValue(user, active);
        await _db.SaveChangesAsync();
        return Ok(new
        {
            user.UserId,
            user.Username,
            user.TypeUser,
            user.Email,
            user.Phone,
            IsActive = prop != null ? (bool)prop.GetValue(user)! : true
        });
    }

    // ========== 2) USER – XEM & TỰ SỬA TÀI KHOẢN ==========
    // GET /api/User/{id}  (ai đăng nhập cũng xem được; có thể tuỳ biến về sau)
    [HttpGet("{id:int}")]
    [Authorize] // để đơn giản: cho phép xem, không rò mật khẩu
    public async Task<IActionResult> GetById(int id)
    {
        var user = await _db.Users.AsNoTracking()
            .Where(u => u.UserId == id)
            .Select(u => new
            {
                u.UserId,
                u.Username,
                u.TypeUser,
                u.Email,
                u.Phone,
                IsActive = (bool?)(EF.Property<bool?>(u, "IsActive")) ?? true
            })
            .FirstOrDefaultAsync();

        return user is null ? NotFound() : Ok(user);
    }

    // GET /api/User/me  → thông tin chính chủ
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        int id = CurrentUserId();
        if (id <= 0) return Unauthorized();

        var user = await _db.Users.AsNoTracking()
            .Where(u => u.UserId == id)
            .Select(u => new
            {
                u.UserId,
                u.Username,
                u.TypeUser,
                u.Email,
                u.Phone,
                IsActive = (bool?)(EF.Property<bool?>(u, "IsActive")) ?? true
            })
            .FirstOrDefaultAsync();

        return user is null ? NotFound() : Ok(user);
    }

    public class UpdateSelfDto
    {
        [MaxLength(255)] public string? Password { get; set; }
        [MaxLength(255), EmailAddress] public string? Email { get; set; }
        [MaxLength(20)] public string? Phone { get; set; }
    }

    // PUT /api/User/me  → user tự sửa (email/phone/password)
    [HttpPut("me")]
    [Authorize(Policy = "ActiveUser")] // chỉ tài khoản đang hoạt động mới cho sửa
    public async Task<IActionResult> UpdateMe([FromBody] UpdateSelfDto dto)
    {
        int id = CurrentUserId();
        if (id <= 0) return Unauthorized();

        var entity = await _db.Users.FirstOrDefaultAsync(u => u.UserId == id);
        if (entity is null) return NotFound();

        if (!string.IsNullOrWhiteSpace(dto.Password))
            entity.Password = dto.Password!.Trim();

        if (!string.IsNullOrWhiteSpace(dto.Email))
        {
            bool dup = await _db.Users.AnyAsync(u => u.Email == dto.Email && u.UserId != id);
            if (dup) return Conflict("Email đã tồn tại.");
            entity.Email = dto.Email!.Trim();
        }

        if (!string.IsNullOrWhiteSpace(dto.Phone))
            entity.Phone = dto.Phone!.Trim();

        await _db.SaveChangesAsync();
        return Ok(new
        {
            entity.UserId,
            entity.Username,
            entity.TypeUser,
            entity.Email,
            entity.Phone,
            IsActive = (bool?)(entity.GetType().GetProperty("IsActive")?.GetValue(entity)) ?? true
        });
    }
}
