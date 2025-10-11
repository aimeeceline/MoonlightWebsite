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
    [Route("api/[controller]")]
    [ApiController]
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
            if (request == null)
                return BadRequest(new { message = "Thiếu dữ liệu." });

            var username = (request.Username ?? string.Empty).Trim();
            var password = (request.Password ?? string.Empty).Trim();

            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
                return BadRequest(new { message = "Username/password trống." });

            var user = await _db.Users.AsNoTracking()
                .FirstOrDefaultAsync(u => u.Username != null && u.Username.ToLower() == username.ToLower());

            if (user == null)
                return Unauthorized("Tên đăng nhập hoặc mật khẩu không đúng.");

            var stored = (user.Password ?? string.Empty).Trim();
            var ok = string.Equals(stored, password, StringComparison.Ordinal);

            if (!ok)
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
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Name, user.Username ?? string.Empty),
                new Claim(ClaimTypes.Role, string.IsNullOrWhiteSpace(user.TypeUser) ? "User" : user.TypeUser),
            };

            if (!string.IsNullOrWhiteSpace(user.Email))
                claims.Add(new Claim(ClaimTypes.Email, user.Email!));
            if (!string.IsNullOrWhiteSpace(user.Phone))
                claims.Add(new Claim("phone", user.Phone!));

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_cfg["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var jwt = new JwtSecurityToken(
                issuer: _cfg["Jwt:Issuer"],
                audience: _cfg["Jwt:Audience"],
                claims: claims,
                notBefore: DateTime.UtcNow,
                expires: DateTime.UtcNow.AddHours(2),
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
                id = User.FindFirstValue(ClaimTypes.NameIdentifier),
                username = User.FindFirstValue(ClaimTypes.Name),
                role = User.FindFirstValue(ClaimTypes.Role),
                email = User.FindFirstValue(ClaimTypes.Email),
                phone = User.FindFirst("phone")?.Value
            });
        }
    }
}
