using Microsoft.EntityFrameworkCore;

namespace CartService.Model
{
    public partial class CartDBContext : DbContext
    {
        public CartDBContext() { }
        public CartDBContext(DbContextOptions<CartDBContext> options) : base(options) { }

        public virtual DbSet<Cart> Carts { get; set; } = null!;
        public virtual DbSet<CartItem> CartItems { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Cart>(entity =>
            {
                entity.HasKey(e => e.CartId);
                entity.Property(e => e.CartId).HasColumnName("CartID");

                entity.Property(e => e.UserId).HasColumnName("UserID");

                entity.Property(e => e.CreateDate)
                      .HasColumnType("datetime")
                      .HasDefaultValueSql("GETUTCDATE()");

                // ✅ Tất cả decimal => dùng 0m (decimal), KHÔNG dùng 0 (int)
                entity.Property(e => e.OriginalTotal)
                      .HasColumnType("decimal(18, 2)")
                      .HasDefaultValue(0m);

                entity.Property(e => e.Discount)
                      .HasColumnType("decimal(18, 2)")
                      .HasDefaultValue(0m);

                entity.Property(e => e.TotalCartPrice)
                      .HasColumnType("decimal(18, 2)")
                      .HasDefaultValue(0m);

                entity.Property(e => e.DiscountCode)
                      .HasMaxLength(50);

                entity.Property(e => e.Quantity)
                      .HasDefaultValue(0);

                // Indexes gợi ý
                entity.HasIndex(e => e.UserId);
            });

            modelBuilder.Entity<CartItem>(entity =>
            {
                entity.HasKey(e => e.CartItemId);
                entity.Property(e => e.CartItemId).HasColumnName("CartItemID");

                entity.Property(e => e.CartId).HasColumnName("CartID");

                entity.Property(e => e.ProductId).HasColumnName("ProductID");

                entity.Property(e => e.ProductName)
                      .HasMaxLength(250);

                entity.Property(e => e.ProductImage)
                      .HasMaxLength(250);

                entity.Property(e => e.Quantity)
                      .HasDefaultValue(1);

                entity.Property(e => e.Price)
                      .HasColumnType("decimal(18, 2)")
                      .HasDefaultValue(0m);

                entity.Property(e => e.TotalCost)
                      .HasColumnType("decimal(18, 2)")
                      .HasDefaultValue(0m);

                entity.HasIndex(e => new { e.CartId, e.ProductId });

                entity.HasOne(d => d.Cart)
                      .WithMany(p => p.CartItems)
                      .HasForeignKey(d => d.CartId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            base.OnModelCreating(modelBuilder);
        }
    }
}
