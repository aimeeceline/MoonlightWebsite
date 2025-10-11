using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

namespace ProductService.Model
{
    public partial class ProductDBContext : DbContext
    {
        public ProductDBContext()
        {
        }

        public ProductDBContext(DbContextOptions<ProductDBContext> options)
            : base(options)
        {
        }

        public virtual DbSet<Category> Categories { get; set; } = null!;
        public virtual DbSet<Product> Products { get; set; } = null!;


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Category>(entity =>
            {
                entity.HasKey(e => e.CategoryId);
                entity.Property(e => e.CategoryId)
                      .UseIdentityColumn()        // ✅ tự tăng
                      .HasColumnName("CategoryID");

                entity.Property(e => e.Name)
                      .HasMaxLength(255)
                      .HasColumnName("name");

                entity.Property(e => e.Description)
                      .HasMaxLength(255)
                      .HasColumnName("decription");
            });

            modelBuilder.Entity<Product>(entity =>
            {
                entity.HasKey(e => e.ProductId);
                entity.Property(e => e.ProductId)
                      .UseIdentityColumn();       // ✅ tự tăng

                entity.Property(e => e.CategoryId).HasColumnName("CategoryID");
                entity.Property(e => e.Name).HasMaxLength(255);
                entity.Property(e => e.Description).HasMaxLength(1000);
                entity.Property(e => e.Image).HasMaxLength(500);
                entity.Property(e => e.Image1).HasMaxLength(500);
                entity.Property(e => e.Image2).HasMaxLength(500);
                entity.Property(e => e.Image3).HasMaxLength(500);
                entity.Property(e => e.Price).HasColumnType("decimal(18, 2)");
                entity.Property(e => e.CreateDate).HasColumnType("datetime");

                // bool -> bit, đừng map MaxLength cho bool
                entity.Property(e => e.Status)
                      .HasColumnName("IsActive"); // ✅ để EF tự map bit

                entity.HasOne(d => d.Category)
                      .WithMany(p => p.Products)
                      .HasForeignKey(d => d.CategoryId)
                      .OnDelete(DeleteBehavior.Cascade);
            });
        }

        partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
    }
}
