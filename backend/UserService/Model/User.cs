using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace UserService.Model
{
    public class User
    {
        public int UserId { get; set; } // PK (IDENTITY)

        [Required, MaxLength(255)]
        public string Username { get; set; } = null!;

        [Required, MaxLength(255)]
        public string Password { get; set; } = null!; // hoặc PasswordHash nếu bạn đã hash

        [Required, MaxLength(50)]
        public string TypeUser { get; set; } = "User"; // "User" / "Admin"...

        [Required, MaxLength(255), EmailAddress]
        public string Email { get; set; } = null!;

        [Required, MaxLength(20)]
        public string Phone { get; set; } = null!;

        // 1-n: User có nhiều địa chỉ giao hàng
        public ICollection<Address> Addresses { get; set; } = new List<Address>();
    }
}
