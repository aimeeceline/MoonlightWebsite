using Microsoft.EntityFrameworkCore;

namespace PaymentService.Model
{
    public partial class PaymentDBContext : DbContext
    {
        public PaymentDBContext() { }
        public PaymentDBContext(DbContextOptions<PaymentDBContext> options) : base(options) { }

        public virtual DbSet<Payment> Payments { get; set; } = null!;

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
#warning Move connection string to configuration in production.
                optionsBuilder.UseSqlServer("Server=sqlserver,1433;Database=PaymentDB;User Id=sa;Password=Lananh@123A;Encrypt=False;TrustServerCertificate=True");
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Payment>(entity =>
            {
                entity.Property(e => e.PaymentId).HasColumnName("PaymentID");

                entity.Property(e => e.UserId).HasColumnName("UserID");
                entity.Property(e => e.OrderId).HasColumnName("OrderID");

                entity.Property(e => e.TotalPrice).HasColumnType("decimal(18, 2)");
                entity.Property(e => e.PaymentDate).HasColumnType("datetime");
                entity.Property(e => e.CreatedAt).HasColumnType("datetime");
                entity.Property(e => e.ExpirationTime).HasColumnType("datetime");

                entity.Property(e => e.PaymentMethod).HasMaxLength(50);
                entity.Property(e => e.Status).HasMaxLength(50);
                entity.Property(e => e.Description).HasMaxLength(200);
                entity.Property(e => e.Note).HasMaxLength(1000);

                entity.Property(e => e.TransactionId).HasMaxLength(100).HasColumnName("TransactionID");
                entity.Property(e => e.ReferenceNumber).HasMaxLength(100).HasColumnName("ReferenceNumber");

                // ✅ FIX: bỏ khoảng trắng thừa
                entity.Property(e => e.OrderCode).HasMaxLength(100).HasColumnName("OrderCode");

                // (gợi ý) thêm index
                entity.HasIndex(e => e.OrderId);
                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.TransactionId);
            });

            base.OnModelCreating(modelBuilder);
        }
    }
}
