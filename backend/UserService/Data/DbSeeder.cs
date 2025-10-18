using System.Linq;
using Microsoft.EntityFrameworkCore;
using UserService.Model;

namespace UserService.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(UserDBContext db)
    {
        // Đảm bảo DB/migration sẵn sàng trước khi seed
        await db.Database.MigrateAsync();

        // ========== 1) ADMIN (KHÔNG ép id = 0, KHÔNG dùng IDENTITY_INSERT) ==========
        var admin = await db.Users.FirstOrDefaultAsync(u => u.TypeUser == "Admin");
        if (admin is null)
        {
            admin = new User
            {
                // KHÔNG set UserId
                Username = "admin",
                Password = "Admin@123", // dev/demo; production nhớ băm mật khẩu
                TypeUser = "Admin",
                Email = "admin@demo.local",
                Phone = "0900000000",
                IsActive = true
            };
            db.Users.Add(admin);
            await db.SaveChangesAsync();
        }

        // ========== 2) HAI USER THƯỜNG ==========
        // U1
        var u1 = await db.Users.FirstOrDefaultAsync(u => u.Username == "alice");
        if (u1 is null)
        {
            u1 = new User
            {
                Username = "alice",
                Password = "User@123",
                TypeUser = "User",
                Email = "alice@demo.local",
                Phone = "0901111111",
                IsActive = true
            };
            db.Users.Add(u1);
            await db.SaveChangesAsync(); // cần UserId để seed Address
        }

        // U2
        var u2 = await db.Users.FirstOrDefaultAsync(u => u.Username == "bob");
        if (u2 is null)
        {
            u2 = new User
            {
                Username = "bob",
                Password = "User@123",
                TypeUser = "User",
                Email = "bob@demo.local",
                Phone = "0902222222",
                IsActive = true
            };
            db.Users.Add(u2);
            await db.SaveChangesAsync();
        }

        // ========== 3) 4 ADDRESS (2 cho mỗi user; mỗi user 1 default) ==========

        // Helper: bảo đảm chỉ 1 địa chỉ default mỗi user
        async Task EnsureSingleDefault(int userId)
        {
            var defaults = await db.Addresses
                .Where(a => a.UserId == userId && a.IsDefault)
                .ToListAsync();

            if (defaults.Count > 1)
            {
                // Giữ lại cái tạo sớm nhất làm default
                var keep = defaults.OrderBy(a => a.AddressId).First();
                foreach (var a in defaults.Where(a => a.AddressId != keep.AddressId))
                    a.IsDefault = false;

                await db.SaveChangesAsync();
            }
        }

        // ---- Cho u1 ----
        var u1AddrCount = await db.Addresses.CountAsync(a => a.UserId == u1.UserId);
        if (u1AddrCount == 0)
        {
            db.Addresses.AddRange(
                new Address
                {
                    UserId = u1.UserId,
                    RecipientName = "Alice",
                    Email = "alice@demo.local",               // ✔ BỔ SUNG Email (bắt buộc)
                    Phone = "0901111111",
                    AddressLine = "22 Nguyễn Kiệm, P.3, Q.Gò Vấp, HCM",
                    Note = null,
                    IsDefault = true
                },
                new Address
                {
                    UserId = u1.UserId,
                    RecipientName = "Alice",
                    Email = "alice@demo.local",               // ✔ BỔ SUNG Email
                    Phone = "0901111111",
                    AddressLine = "12 Trần Hưng Đạo, P.Cầu Ông Lãnh, Q.1, HCM",
                    Note = "Giao giờ hành chính",
                    IsDefault = false
                }
            );
            await db.SaveChangesAsync();
            await EnsureSingleDefault(u1.UserId);
        }
        else if (u1AddrCount == 1)
        {
            // Bổ sung thêm 1 địa chỉ để đủ 2
            if (!await db.Addresses.AnyAsync(a => a.UserId == u1.UserId && !a.IsDefault))
            {
                db.Addresses.Add(new Address
                {
                    UserId = u1.UserId,
                    RecipientName = "Alice",
                    Email = "alice@demo.local",               // ✔ BỔ SUNG Email
                    Phone = "0901111111",
                    AddressLine = "12 Trần Hưng Đạo, P.Cầu Ông Lãnh, Q.1, HCM",
                    Note = "Giao giờ hành chính",
                    IsDefault = false
                });
                await db.SaveChangesAsync();
            }
            await EnsureSingleDefault(u1.UserId);
        }

        // ---- Cho u2 ----
        var u2AddrCount = await db.Addresses.CountAsync(a => a.UserId == u2.UserId);
        if (u2AddrCount == 0)
        {
            db.Addresses.AddRange(
                new Address
                {
                    UserId = u2.UserId,
                    RecipientName = "Bob",
                    Email = "bob@demo.local",                 // ✔ BỔ SUNG Email
                    Phone = "0902222222",
                    AddressLine = "5 Phan Đăng Lưu, P.3, Q.Bình Thạnh, HCM",
                    Note = "Gọi trước khi giao",
                    IsDefault = true
                },
                new Address
                {
                    UserId = u2.UserId,
                    RecipientName = "Bob",
                    Email = "bob@demo.local",                 // ✔ BỔ SUNG Email
                    Phone = "0902222222",
                    AddressLine = "8 Nguyễn Trãi, P.Bến Thành, Q.1, HCM",
                    Note = null,
                    IsDefault = false
                }
            );
            await db.SaveChangesAsync();
            await EnsureSingleDefault(u2.UserId);
        }
        else if (u2AddrCount == 1)
        {
            if (!await db.Addresses.AnyAsync(a => a.UserId == u2.UserId && !a.IsDefault))
            {
                db.Addresses.Add(new Address
                {
                    UserId = u2.UserId,
                    RecipientName = "Bob",
                    Email = "bob@demo.local",                 // ✔ BỔ SUNG Email
                    Phone = "0902222222",
                    AddressLine = "8 Nguyễn Trãi, P.Bến Thành, Q.1, HCM",
                    Note = null,
                    IsDefault = false
                });
                await db.SaveChangesAsync();
            }
            await EnsureSingleDefault(u2.UserId);
        }

        // ✅ Admin KHÔNG có address — giữ nguyên.
    }
}
