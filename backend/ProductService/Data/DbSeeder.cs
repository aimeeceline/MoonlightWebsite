using Microsoft.EntityFrameworkCore;
using ProductService.Model;

namespace ProductService.Data
{
    public static class DbSeeder
    {
        public static async Task SeedAsync(ProductDBContext db)
        {
            // ==== Categories ====
            // 1) Seed Categories nếu trống
            if (!await db.Categories.AnyAsync())
            {
                db.Categories.AddRange(
                    new Category { Name = "Nhẫn cưới", Description = "..." },
                    new Category { Name = "Dây chuyền", Description = "..." },
                    new Category { Name = "Bông tai", Description = "..." }
                );
                await db.SaveChangesAsync();
                Console.WriteLine("[SEED] Categories inserted");
            }

            // 2) Quan trọng: clear tracker để tránh giữ các instance Category
            db.ChangeTracker.Clear();

            // 3) Lấy ID thực tế từ DB (không hard-code)
            var cats = await db.Categories.ToDictionaryAsync(c => c.Name, c => c.CategoryId);

            // 4) Seed Products nếu trống
            if (!await db.Products.AnyAsync())
            {
                db.Products.AddRange(
                    new Product { CategoryId = cats["Nhẫn cưới"], Name = "Ring Aura", Price = 590000m, Inventory = 20, Image = "/images/ring-aura.jpg", CreateDate = DateTime.UtcNow, Status = true },
                    new Product { CategoryId = cats["Nhẫn cưới"], Name = "Ring Heart", Price = 990000m, Inventory = 15, Image = "/images/ring-heart.jpg", CreateDate = DateTime.UtcNow, Status = true },
                    new Product { CategoryId = cats["Dây chuyền"], Name = "Necklace Ruby", Price = 2290000m, Inventory = 12, Image = "/images/necklace-ruby.jpg", CreateDate = DateTime.UtcNow, Status = true },
                    new Product { CategoryId = cats["Bông tai"], Name = "Earring Pearl", Price = 299000m, Inventory = 18, Image = "/images/earring-pearl.jpg", CreateDate = DateTime.UtcNow, Status = true }
                // ... thêm các sp khác
                );
                await db.SaveChangesAsync();
                Console.WriteLine("[SEED] Products inserted");
            }
        
            else
            {
                Console.WriteLine("[SEED] Skip (Products already exist)");
            }
}
    }
}
