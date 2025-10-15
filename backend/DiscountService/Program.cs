using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using DiscountService.Model; // DiscountDBContext (nếu có)

var builder = WebApplication.CreateBuilder(args);

// (tuỳ) DB
var conn = builder.Configuration.GetConnectionString("DiscountDB")
        ?? builder.Configuration.GetConnectionString("Default")
        ?? "Server=sqlserver,1433;Database=DiscountDB;User Id=sa;Password=Lananh@123A;Encrypt=False;TrustServerCertificate=True";
builder.Services.AddDbContext<DiscountDBContext>(opt => opt.UseSqlServer(conn));

// MVC + Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "DiscountService API", Version = "v1" });
    var scheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Nhập: Bearer {token}"
    };
    c.AddSecurityDefinition("Bearer", scheme);
    c.AddSecurityRequirement(new() { { scheme, Array.Empty<string>() } });
});

// CORS
builder.Services.AddCors(o => o.AddPolicy("dev", p =>
    p.WithOrigins("http://localhost:3000", "http://127.0.0.1:3000")
     .AllowAnyHeader().AllowAnyMethod().SetPreflightMaxAge(TimeSpan.FromHours(1))));

// JWT (tùy)
var jwtKey = builder.Configuration["Jwt:Key"] ?? "dev-secret-change-me";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o => o.TokenValidationParameters = new()
    {
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        RoleClaimType = ClaimTypes.Role,
        NameClaimType = ClaimTypes.NameIdentifier
    });

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI(c => { c.SwaggerEndpoint("/swagger/v1/swagger.json", "DiscountService v1"); c.RoutePrefix = "swagger"; });
app.UseCors("dev");
// app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapGet("/health", () => "OK");
app.Run();
