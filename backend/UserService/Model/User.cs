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
        public string Password { get; set; } = string.Empty; // (dev có thể là plaintext; prod nên hash)

        [Required, MaxLength(50)]
        public string TypeUser { get; set; } = "User";       // "User"/"Admin"

        [Required, MaxLength(255), EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required, MaxLength(20)]
        public string Phone { get; set; } = string.Empty;

        public ICollection<Address> Addresses { get; set; } = new List<Address>();
    }
}
