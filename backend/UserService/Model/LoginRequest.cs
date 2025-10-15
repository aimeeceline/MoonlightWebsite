// LoginRequest.cs
namespace UserService.Model
{
    public class LoginRequest
    {
        public string Username { get; set; } = string.Empty; // 👈 thêm mặc định
        public string Password { get; set; } = string.Empty; // 👈 thêm mặc định
    }
}
