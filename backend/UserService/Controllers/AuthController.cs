using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using UserService.Model;

namespace UserService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserDBContext _db;
        private readonly IConfiguration _cfg;

        public AuthController(UserDBContext db, IConfiguration cfg)
        {
            _db = db;
            _cfg = cfg;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (request == null) return BadRequest(new { message = "Thiếu dữ liệu." });

            var username = (request.Username ?? "").Trim();
            var password = (request.Password ?? "").Trim();
            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
                return BadRequest(new { message = "Username/password trống." });

            var user = await _db.Users.AsNoTracking()
                .FirstOrDefaultAsync(u => u.Username != null && u.Username.ToLower() == username.ToLower());

            if (user == null) return Unauthorized("Tên đăng nhập hoặc mật khẩu không đúng.");

            var stored = (user.Password ?? "").Trim();
            if (!string.Equals(stored, password, StringComparison.Ordinal))
                return Unauthorized("Tên đăng nhập hoặc mật khẩu không đúng.");

            var token = GenerateJwtToken(user);
            return Ok(new
            {
                token,
                username = user.Username,
                role = string.IsNullOrWhiteSpace(user.TypeUser) ? "User" : user.TypeUser
            });
        }

        private string GenerateJwtToken(User user)
        {
            // đọc config
            var issuer = _cfg["Jwt:Issuer"] ?? throw new InvalidOperationException("Missing Jwt:Issuer");
            var audience = _cfg["Jwt:Audience"] ?? throw new InvalidOperationException("Missing Jwt:Audience");
            var keyStr = _cfg["Jwt:Key"] ?? throw new InvalidOperationException("Missing Jwt:Key");

            var role = string.IsNullOrWhiteSpace(user.TypeUser) ? "User" : user.TypeUser;

            // 🔑 luôn nhúng userId dưới 3 tên claim phổ biến
            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.UserId.ToString()),       // "sub" = userId (số)
                new Claim("uid", user.UserId.ToString()),                             // fallback "uid"
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),         // nameidentifier

                new Claim(ClaimTypes.Name, user.Username ?? string.Empty),
                new Claim(ClaimTypes.Role, role),
            };

            if (!string.IsNullOrWhiteSpace(user.Email))
                claims.Add(new Claim(ClaimTypes.Email, user.Email!));
            if (!string.IsNullOrWhiteSpace(user.Phone))
                claims.Add(new Claim("phone", user.Phone!));

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyStr));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var now = DateTime.UtcNow;
            var jwt = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                notBefore: now,
                expires: now.AddHours(2),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(jwt);
        }

        [Authorize]
        [HttpGet("me")]
        public IActionResult Me()
        {
            return Ok(new
            {
                id = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("uid")
                     ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub),
                username = User.FindFirstValue(ClaimTypes.Name),
                role = User.FindFirstValue(ClaimTypes.Role),
                email = User.FindFirstValue(ClaimTypes.Email),
                phone = User.FindFirst("phone")?.Value
            });
        }
    }

    public record LoginRequest(string Username, string Password);
}
