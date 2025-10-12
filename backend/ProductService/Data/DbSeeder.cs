using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ProductService.Model;

namespace ProductService.Data
{
    public static class DbSeeder
    {
        /// <summary>
        /// Seed KHÔNG reset: chạy an toàn nhiều lần, add nếu thiếu, update nếu có.
        /// </summary>
        public static async Task SeedAsync(ProductDBContext db, ILogger logger)
        {
            // Đảm bảo DB/migrations sẵn sàng
            await db.Database.MigrateAsync();

            // ====== CATEGORIES (id tự tăng) ======
            // Danh mục chuẩn để hiển thị
            var catSeeds = new[]
            {
                new Category { Name = "Nhẫn cưới",  Description = "Trang sức cưới – nhẫn đôi" },
                new Category { Name = "Bông tai",   Description = "Bông tai/khuyên tai" },
                new Category { Name = "Dây chuyền", Description = "Dây chuyền/vòng cổ" },
                new Category { Name = "Lắc tay",    Description = "Vòng tay/lắc tay" },
            };

            foreach (var c in catSeeds)
            {
                // Tìm theo Name (coi Name là “unique” về mặt nghiệp vụ)
                var existed = await db.Categories
                    .AsNoTracking()
                    .FirstOrDefaultAsync(x => x.Name == c.Name);

                if (existed is null)
                {
                    db.Categories.Add(c);
                }
                else
                {
                    // Giữ nguyên ID cũ, chỉ cập nhật nội dung
                    c.CategoryId = existed.CategoryId;
                    db.Categories.Update(c);
                }
            }
            await db.SaveChangesAsync();
            db.ChangeTracker.Clear();

            // Map tên -> id để seed sản phẩm
            var cats = await db.Categories.AsNoTracking()
                         .ToDictionaryAsync(x => x.Name, x => x.CategoryId);

            // ====== PRODUCTS (id tự tăng) ======
            var prodSeeds = new[]
            {
                new Product {
                    CategoryId = cats["Nhẫn cưới"],
                    Name="Cặp nhẫn cưới Kim cương Vàng trắng 14K",
                    Description="BST Hạnh phúc vàng...",
                    DescriptionDetails="Kim cương 57 giác cắt chuẩn...",
                    Price=10005000m, Inventory=20, ViewCount=101,
                    Image="1001_1.png", Image1="1001_1.png", Image2="1001_1.png", Image3="1001_1.png",
                    CreateDate=DateTime.UtcNow, Status=true
                },
                new Product {
                    CategoryId = cats["Nhẫn cưới"],
                    Name="Cặp nhẫn cưới Vàng 18K Sánh Duyên",
                    Description="BST Hạnh phúc vàng...",
                    DescriptionDetails="Nhẫn cưới vàng 18K hiện đại, vẫn giữ nét truyền thống.",
                    Price=15000000m, Inventory=150, ViewCount=1524,
                    Image="1002_1.png", Image1="1002_2.png", Image2="1002_3.png", Image3="1002_4.png",
                    CreateDate=DateTime.UtcNow, Status=true
                },
                new Product {
                    CategoryId = cats["Nhẫn cưới"],
                    Name="Cặp nhẫn cưới Vàng trắng 14K Trầu Cau",
                    Description="BST The Heart of Gold...",
                    DescriptionDetails="Thiết kế tinh xảo, vật đính ước thề nguyện hạnh phúc.",
                    Price=15266000m, Inventory=120, ViewCount=120,
                    Image="1003_1.png", Image1="1003_2.png", Image2="1003_3.png", Image3="1003_4.png",
                    CreateDate=DateTime.UtcNow, Status=true
                },
                new Product {
                    CategoryId = cats["Nhẫn cưới"],
                    Name="Cặp nhẫn cưới Kim cương Vàng trắng 14K Disney",
                    Description="BST The Heart of Gold...",
                    DescriptionDetails="Nhấn kim cương 57 giác cắt chuẩn.",
                    Price=19140000m, Inventory=120, ViewCount=1040,
                    Image="1004_1.png", Image1="1004_2.png", Image2="1004_3.png", Image3="1004_4.png",
                    CreateDate=DateTime.UtcNow, Status=true
                },
                new Product {
                    CategoryId = cats["Dây chuyền"],
                    Name="Dây cổ cưới Vàng 24K Đính đá Aventurine Lá Ngọc Cành Vàng",
                    Description="BST Lá Ngọc Cành Vàng...",
                    DescriptionDetails="Đường nét uốn lượn, đính đá Aventurine.",
                    Price=253708000m, Inventory=120, ViewCount=103,
                    Image="2001_1.png", Image1="2001_2.png", Image2="2001_3.png", Image3="2001_4.png",
                    CreateDate=DateTime.UtcNow, Status=true
                },
                new Product {
                    CategoryId = cats["Dây chuyền"],
                    Name="Dây cổ Vàng 24K Trầu Cau",
                    Description="BST Trầu Cau...",
                    DescriptionDetails="Lá trầu ôm quả cau, hòa quyện truyền thống.",
                    Price=199082000m, Inventory=120, ViewCount=130,
                    Image="2002_1.png", Image1="2002_2.png", Image2="2002_3.png", Image3="2002_4.png",
                    CreateDate=DateTime.UtcNow, Status=true
                },
                new Product {
                    CategoryId = cats["Dây chuyền"],
                    Name="Dây cổ Vàng 18K đính đá Ruby",
                    Description="Trọng lượng tham khảo ~31.86 phân",
                    DescriptionDetails="Đá Ruby đỏ nồng nàn, mài giũa sắc bóng.",
                    Price=39637000m, Inventory=120, ViewCount=130,
                    Image="2003_1.png", Image1="2003_2.png", Image2="2003_3.png", Image3="2003_4.png",
                    CreateDate=DateTime.UtcNow, Status=true
                },
                new Product {
                    CategoryId = cats["Bông tai"],
                    Name="Bông tai cưới Kim cương Vàng trắng 14K Lá Ngọc Cành Vàng",
                    Description="BST Lá Ngọc Cành Vàng...",
                    DescriptionDetails="Thiết kế lá 'ngọc' hài hòa, nổi bật.",
                    Price=57358000m, Inventory=120, ViewCount=130,
                    Image="3001_1.png", Image1="3001_2.png", Image2="3001_3.png", Image3="3001_4.png",
                    CreateDate=DateTime.UtcNow, Status=true
                },
            };

            foreach (var p in prodSeeds)
            {
                // Upsert theo (Name, CategoryId) để không trùng
                var existed = await db.Products
                    .AsNoTracking()
                    .FirstOrDefaultAsync(x => x.Name == p.Name && x.CategoryId == p.CategoryId);

                if (existed is null)
                {
                    db.Products.Add(p);
                }
                else
                {
                    p.ProductId = existed.ProductId; // giữ ID cũ
                    db.Products.Update(p);
                }
            }

            await db.SaveChangesAsync();
            logger.LogInformation("[SEED] Done (safe, no reset).");
        }
    }
}
