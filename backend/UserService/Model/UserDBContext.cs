using Microsoft.EntityFrameworkCore;
namespace UserService.Model
{
    public partial class UserDBContext : DbContext
    {
        public UserDBContext(DbContextOptions<UserDBContext> options) : base(options) { }

        public virtual DbSet<User> Users { get; set; } = null!;
        public virtual DbSet<Address> Addresses { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        { 
            // ===== User =====
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(u => u.UserId);
                entity.Property(u => u.UserId)
                      .ValueGeneratedOnAdd()
                      .HasColumnName("userID");

                entity.Property(u => u.Username).IsRequired().HasMaxLength(255).HasColumnName("username");
                entity.Property(u => u.Password).IsRequired().HasMaxLength(255).HasColumnName("password");
                entity.Property(u => u.TypeUser).IsRequired().HasMaxLength(50).HasColumnName("typeUser");
                entity.Property(u => u.Email).IsRequired().HasMaxLength(255).HasColumnName("email");
                entity.Property(u => u.Phone).IsRequired().HasMaxLength(20).HasColumnName("phone");
            });

            // ===== Address =====
            modelBuilder.Entity<Address>(entity =>
            {
                entity.ToTable("Addresses");
                entity.HasKey(a => a.AddressId);

                entity.Property(a => a.AddressId).ValueGeneratedOnAdd();
                entity.Property(a => a.UserId).IsRequired();

                entity.Property(a => a.RecipientName).IsRequired().HasMaxLength(100);
                entity.Property(a => a.Phone).IsRequired().HasMaxLength(20);
                entity.Property(a => a.AddressLine).IsRequired().HasMaxLength(255);
                entity.Property(a => a.Note).HasMaxLength(500);
                entity.Property(a => a.IsDefault).HasColumnType("bit");

                entity.HasOne(a => a.User)
                      .WithMany(u => u.Addresses)
                      .HasForeignKey(a => a.UserId)
                      .OnDelete(DeleteBehavior.Cascade);

                // Mỗi user chỉ có 1 địa chỉ mặc định
                entity.HasIndex(a => new { a.UserId, a.IsDefault })
                      .IsUnique()
                      .HasFilter("[IsDefault] = 1");
            });

            base.OnModelCreating(modelBuilder);
        }
    }
}
