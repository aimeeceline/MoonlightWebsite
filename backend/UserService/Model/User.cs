// User.cs
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace UserService.Model
{
    public class User
    {
        public int UserId { get; set; } // IDENTITY (auto-increment)

        [Required, MaxLength(255)]
        public string Username { get; set; } = string.Empty;

        [Required, MaxLength(255)]
        public string Password { get; set; } = string.Empty; // (dev plaintext; prod nên hash)

        [Required, MaxLength(50)]
        public string TypeUser { get; set; } = "User";       // "User"/"Admin"

        [Required, MaxLength(255), EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required, MaxLength(20), Phone]
        public string Phone { get; set; } = string.Empty;

        // NEW: theo ERD — 1 thì đang hoạt động, 0 bị khóa
        public bool IsActive { get; set; } = true;

        public ICollection<Address> Addresses { get; set; } = new List<Address>();
    }
}
