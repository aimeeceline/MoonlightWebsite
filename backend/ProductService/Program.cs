using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
// using ProductService.Repository; // đăng ký DI nếu dùng
using ProductService.Model; // ProductDBContext
using ProductService.Data;

var builder = WebApplication.CreateBuilder(args);

// 1) DB: ưu tiên ENV, fallback appsettings
var conn = Environment.GetEnvironmentVariable("ConnectionStrings__Default")
           ?? builder.Configuration.GetConnectionString("DefaultConnection")
           ?? builder.Configuration.GetConnectionString("Default");
builder.Services.AddDbContext<ProductDBContext>(o => o.UseSqlServer(conn));

// 2) (tuỳ) DI repository/service của Product
// builder.Services.AddScoped<ProcductRepository>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 3) JWT từ ENV (đồng bộ các service)
var issuer   = builder.Configuration["Jwt:Issuer"]   ?? "http://userservice:8080";
var audience = builder.Configuration["Jwt:Audience"] ?? "bae-beauty-api";
var key      = builder.Configuration["Jwt:Key"]      ?? "SuperSecretKeyDontCommit";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
  .AddJwtBearer(o => o.TokenValidationParameters = new()
  {
      ValidateIssuer = true, ValidIssuer = issuer,
      ValidateAudience = true, ValidAudience = audience,
      ValidateIssuerSigningKey = true, IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
      ValidateLifetime = true
  });

builder.Services.AddAuthorization();

// (tuỳ) static files nếu service trả ảnh
builder.Services.AddDirectoryBrowser();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

// KHÔNG ép HTTPS trong container
// app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

// (tuỳ) static files (giống file cũ của em)
app.UseStaticFiles();
app.MapControllers();

// Nghe 8080 trong container
app.Urls.Add("http://0.0.0.0:8080");

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ProductDBContext>();
    try
    {
        await db.Database.MigrateAsync();
        await DbSeeder.SeedAsync(db);
        Console.WriteLine("[PRODUCT SEED] done");
    }
    catch (Exception ex)
    {
        Console.WriteLine("[PRODUCT SEED] failed: " + ex.Message);
        throw; // tùy bạn: có thể không throw nếu muốn app vẫn chạy
    }
}


app.MapGet("/", () => "ProductService OK");

app.Run();
