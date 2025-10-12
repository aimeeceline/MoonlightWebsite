using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using ProductService.Data;
using ProductService.Model;
using ProductService.Repository;

var builder = WebApplication.CreateBuilder(args);

// ===== 1) Kết nối DB =====
var conn =
    builder.Configuration.GetConnectionString("ProductDB")
 ?? builder.Configuration.GetConnectionString("DefaultConnection")
 ?? builder.Configuration.GetConnectionString("Default")
 ?? "Server=sqlserver,1433;Database=ProductDB;User Id=sa;Password=Lananh@123A;TrustServerCertificate=True;";

if (string.IsNullOrWhiteSpace(conn))
    throw new InvalidOperationException("Missing connection string ProductDB/Default");

builder.Services.AddDbContext<ProductDBContext>(o => o.UseSqlServer(conn));

// ===== 2) MVC + Swagger =====
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "ProductService API", Version = "v1" });
});

// ===== 3) CORS cho FE (Dev) =====
// Nếu bạn chắc FE luôn ở 3000 thì có thể giới hạn .WithOrigins("http://localhost:3000")
builder.Services.AddCors(o => o.AddPolicy("web", p =>
    p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()
));

// ===== 4) Đăng ký DI cho repository =====
// Nếu Controller inject IProductRepository<Product>
builder.Services.AddScoped<IProductRepository<Product>, ProductRepository>();
// Nếu chỗ khác dùng trực tiếp class
builder.Services.AddScoped<ProductRepository>();
builder.Services.AddScoped<CategoryRepository>();


var app = builder.Build();

// ===== 5) Chạy Seeder (có hỗ trợ RESET_SEED=true) =====

// Seed không reset, chạy an toàn nhiều lần
using(var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ProductService.Model.ProductDBContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("Seeder");
    try
    {
        await ProductService.Data.DbSeeder.SeedAsync(db, logger); // <-- chỉ 2 tham số
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "[SEED] failed - app vẫn chạy");
    }
}
// phục vụ ảnh

// ===== 6) Pipeline =====
// Dev: KHÔNG ép HTTPS (tránh lỗi 307/SSL khi gọi từ FE)
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}


app.UseCors("web");

app.UseSwagger();
app.UseSwaggerUI();
app.UseStaticFiles();

app.MapControllers();

app.Run();
