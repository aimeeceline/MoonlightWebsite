using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

namespace DiscountService.Model
{
    public partial class DiscountDBContext : DbContext
    {
        public DiscountDBContext()
        {
        }

        public DiscountDBContext(DbContextOptions<DiscountDBContext> options)
            : base(options)
        {
        }

        public virtual DbSet<Discount> Discounts { get; set; } = null!;
        public virtual DbSet<DiscountUsage> DiscountUsages { get; set; } = null!;

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see http://go.microsoft.com/fwlink/?LinkId=723263.
                optionsBuilder.UseSqlServer("Server=LAPTOP-B1P0DK29;Database=DiscountDB;integrated security=true;");
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Discount>(entity =>
            {
                entity.HasIndex(e => e.Code, "UQ_DiscountCode")
                    .IsUnique();

                entity.Property(e => e.DiscountId).HasColumnName("DiscountID");

                entity.Property(e => e.Code).HasMaxLength(50);

                entity.Property(e => e.CreateDate)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.DateStart).HasColumnType("datetime");

                entity.Property(e => e.Description).HasMaxLength(255);

                entity.Property(e => e.DiscountValue).HasColumnType("decimal(5, 2)");

                entity.Property(e => e.ExpirationDate).HasColumnType("datetime");

                entity.Property(e => e.MinOrderValue).HasColumnType("decimal(18, 2)");
            });

            modelBuilder.Entity<DiscountUsage>(entity =>
            {
                entity.HasKey(e => e.UsageId)
                    .HasName("PK__Discount__29B197C0060DEAE8");

                entity.ToTable("DiscountUsage");

                entity.Property(e => e.UsageId).HasColumnName("UsageID");

                entity.Property(e => e.DateUsed)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.DiscountId).HasColumnName("DiscountID");

                entity.Property(e => e.OrderId).HasColumnName("OrderID");

                entity.Property(e => e.UserId).HasColumnName("UserID");

                entity.HasOne(d => d.Discount)
                    .WithMany(p => p.DiscountUsages)
                    .HasForeignKey(d => d.DiscountId)
                    .HasConstraintName("FK__DiscountU__Disco__08EA5793");
            });

            OnModelCreatingPartial(modelBuilder);
        }

        partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
    }
}
