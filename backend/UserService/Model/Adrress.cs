// Address.cs
using System.ComponentModel.DataAnnotations;

namespace UserService.Model
{
    public class Address
    {
        public int AddressId { get; set; }        // PK (IDENTITY)

        // FK -> User
        public int UserId { get; set; }
        public User User { get; set; } = null!;

        [Required, MaxLength(100)]
        public string RecipientName { get; set; } = null!; // Tên người nhận

        [Required, MaxLength(255), EmailAddress]           // SỬA: EmailAddress (chuẩn .NET)
        public string Email { get; set; } = null!;

        [Required, MaxLength(20), Phone]                   // Phone attribute ok
        public string Phone { get; set; } = null!;

        [Required, MaxLength(255)]
        public string AddressLine { get; set; } = null!;   // Địa chỉ chi tiết

        [MaxLength(500)]
        public string? Note { get; set; }                  // Ghi chú giao hàng

        public bool IsDefault { get; set; } = false;       // Địa chỉ mặc định
    }
}
