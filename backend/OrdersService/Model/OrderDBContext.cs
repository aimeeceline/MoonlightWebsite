using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

namespace OrdersService.Model
{
    public partial class OrderDBContext : DbContext
    {
        public OrderDBContext()
        {
        }

        public OrderDBContext(DbContextOptions<OrderDBContext> options)
            : base(options)
        {
        }

        public virtual DbSet<Order> Orders { get; set; } = null!;
        public virtual DbSet<OrdersItem> OrdersItems { get; set; } = null!;

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see http://go.microsoft.com/fwlink/?LinkId=723263.
                optionsBuilder.UseSqlServer("Server=LAPTOP-B1P0DK29;Database=OrderDB;integrated security=true;");
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Order>(entity =>
            {
                entity.Property(e => e.OrderId).ValueGeneratedOnAdd();

                entity.Property(e => e.CreatedDate).HasColumnType("datetime");

                entity.Property(e => e.Status).HasMaxLength(100);

                entity.Property(e => e.TotalCost).HasColumnType("decimal(18, 2)");
                entity.Property(e => e.Discount).HasColumnType("decimal(18, 2)");  // Cấu hình Discount
                entity.Property(e => e.Ship).HasColumnType("decimal(18, 2)");
                entity.Property(e => e.DiscountCode).HasMaxLength(100);
            });

            modelBuilder.Entity<OrdersItem>(entity =>
            {
                entity.HasKey(e => e.OrderItemId)
                    .HasName("PK__OrdersIt__57ED068103317E3D");

                entity.Property(e => e.OrderItemId).ValueGeneratedOnAdd();

                entity.Property(e => e.NameReceive).HasMaxLength(500);
                entity.Property(e => e.Name).HasMaxLength(500);
                entity.Property(e => e.ImageProduct).HasMaxLength(500);
                entity.Property(e => e.CategoryName).HasMaxLength(500);

                entity.Property(e => e.Address).HasMaxLength(500);

                entity.Property(e => e.CreatedDate).HasColumnType("datetime");

                entity.Property(e => e.Discount).HasColumnType("decimal(18, 2)");

                entity.Property(e => e.Email).HasMaxLength(255);

                entity.Property(e => e.Note).HasMaxLength(1000);

                entity.Property(e => e.PaymentMethod).HasMaxLength(100);

                entity.Property(e => e.PaymentStatus).HasMaxLength(100);

                entity.Property(e => e.Phone).HasMaxLength(20);

                entity.Property(e => e.Price).HasColumnType("decimal(18, 2)");

                entity.Property(e => e.Ship).HasColumnType("decimal(18, 2)");

                entity.Property(e => e.TotalCost).HasColumnType("decimal(18, 2)");

                entity.HasOne(d => d.Order)
                    .WithMany(p => p.OrdersItems)
                    .HasForeignKey(d => d.OrderId)
                    .OnDelete(DeleteBehavior.Cascade)
                    .HasConstraintName("FK__OrdersIte__Order__0519C6AF");
            });

            OnModelCreatingPartial(modelBuilder);
        }

        partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
    }
}
