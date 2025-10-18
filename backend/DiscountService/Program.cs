using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using DiscountService.Model;

var builder = WebApplication.CreateBuilder(args);

/* ============== DB ============== */
var conn =
    builder.Configuration.GetConnectionString("DiscountDB")
 ?? "Server=sqlserver,1433;Database=DiscountDB;User Id=sa;Password=Lananh@123A;Encrypt=False;TrustServerCertificate=True";

builder.Services.AddDbContext<DiscountDBContext>(opt => opt.UseSqlServer(conn));

/* ============== Controllers + Swagger ============== */
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "DiscountService", Version = "v1" });
    // (Optional) Bearer, nếu bạn muốn bảo vệ endpoint
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Nhập: Bearer {token}"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }, Array.Empty<string>() }
    });
});

/* ============== CORS Dev ============== */
builder.Services.AddCors(p => p.AddPolicy("dev", b => b
    .WithOrigins("http://localhost:3000", "http://127.0.0.1:3000", "https://localhost:3000")
    .AllowAnyHeader().AllowAnyMethod()
));

/* ============== (Optional) JWT ============== */
var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSection["Key"];
if (!string.IsNullOrWhiteSpace(jwtKey))
{
    builder.Services
        .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(o =>
        {
            o.TokenValidationParameters = new()
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtSection["Issuer"],
                ValidAudience = jwtSection["Audience"],
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey!)),
                ClockSkew = TimeSpan.FromMinutes(2)
            };
        });
}

var app = builder.Build();

/* ============== Auto-migrate ============== */
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<DiscountDBContext>();
    await db.Database.MigrateAsync();
}

/* ============== Pipeline ============== */
app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("dev");
// app.UseHttpsRedirection();
if (!string.IsNullOrWhiteSpace(jwtKey))
{
    app.UseAuthentication();
    app.UseAuthorization();
}
app.MapControllers();

app.MapGet("/health", () => "OK");

app.Run();
