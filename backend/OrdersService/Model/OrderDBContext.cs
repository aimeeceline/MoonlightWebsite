using System;
using Microsoft.EntityFrameworkCore;

namespace OrdersService.Model
{
    public partial class OrderDBContext : DbContext
    {
        public OrderDBContext() { }

        public OrderDBContext(DbContextOptions<OrderDBContext> options) : base(options) { }

        public virtual DbSet<Order> Orders { get; set; } = null!;
        public virtual DbSet<OrdersItem> OrdersItems { get; set; } = null!;

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
                optionsBuilder.UseSqlServer("Server=sqlserver,1433;Database=OrderDB;User Id=sa;Password=Lananh@123A;Encrypt=False;TrustServerCertificate=True");
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Order>(entity =>
            {
                entity.HasKey(e => e.OrderId);
                entity.Property(e => e.OrderId).ValueGeneratedOnAdd();

                entity.Property(e => e.CreatedDate).HasColumnType("datetime");
                entity.Property(e => e.Status).HasMaxLength(100);

                entity.Property(e => e.TotalCost).HasColumnType("decimal(18, 2)");
                entity.Property(e => e.Discount).HasColumnType("decimal(18, 2)");
                entity.Property(e => e.Ship).HasColumnType("decimal(18, 2)");
                entity.Property(e => e.DiscountCode).HasMaxLength(50); // đúng ERD (trước đây đôi khi là 100) :contentReference[oaicite:1]{index=1}

                entity.Property(e => e.NameReceive).HasMaxLength(500);
                entity.Property(e => e.Phone).HasMaxLength(20);
                entity.Property(e => e.Email).HasMaxLength(255);
                entity.Property(e => e.Address).HasMaxLength(500);
                entity.Property(e => e.Note).HasMaxLength(500);

                entity.Property(e => e.PaymentMethod).HasMaxLength(100);
                entity.Property(e => e.PaymentStatus).HasMaxLength(100);
            });

            modelBuilder.Entity<OrdersItem>(entity =>
            {
                entity.HasKey(e => e.OrderItemId);

                entity.Property(e => e.OrderItemId).ValueGeneratedOnAdd();
                entity.Property(e => e.CreatedDate).HasColumnType("datetime");

                entity.Property(e => e.CategoryName).HasMaxLength(500);
                entity.Property(e => e.Name).HasMaxLength(500);
                entity.Property(e => e.ImageProduct).HasMaxLength(500);

                entity.Property(e => e.Price).HasColumnType("decimal(18, 2)");
                entity.Property(e => e.TotalCost).HasColumnType("decimal(18, 2)");
                entity.Property(e => e.Note).HasMaxLength(1000);

                entity.HasOne(d => d.Order)
                      .WithMany(p => p.OrdersItems)
                      .HasForeignKey(d => d.OrderId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            base.OnModelCreating(modelBuilder);
        }
    }
}
