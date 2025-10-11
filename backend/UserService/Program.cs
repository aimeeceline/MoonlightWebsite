using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using UserService.Model; // UserDBContext

var builder = WebApplication.CreateBuilder(args);

// ---------- Controllers + Swagger (kèm Bearer) ----------
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "UserService", Version = "v1" });
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
        {
            new OpenApiSecurityScheme { Reference = new OpenApiReference
                { Type = ReferenceType.SecurityScheme, Id = "Bearer" } },
            Array.Empty<string>()
        }
    });
});

// ---------- DB: ưu tiên ENV, fallback appsettings ----------
var conn =
    Environment.GetEnvironmentVariable("ConnectionStrings__Default") // từ docker-compose
    ?? builder.Configuration.GetConnectionString("DefaultConnection")
    ?? builder.Configuration.GetConnectionString("Default");

builder.Services.AddDbContext<UserDBContext>(options => options.UseSqlServer(conn));

// ---------- CORS (không bắt buộc khi đi qua Nginx) ----------
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", p => p
        .AllowAnyOrigin()
        .AllowAnyHeader()
        .AllowAnyMethod());
});

// ---------- JWT (đọc từ ENV Jwt__Issuer/Audience/Key) ----------
var jwtIssuer   = builder.Configuration["Jwt:Issuer"]   ?? "http://userservice:8080";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "bae-beauty-api";
var jwtKey      = builder.Configuration["Jwt:Key"]      ?? "SuperSecretKeyDontCommit";
var signingKey  = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,   ValidIssuer = jwtIssuer,
            ValidateAudience = true, ValidAudience = jwtAudience,
            ValidateIssuerSigningKey = true, IssuerSigningKey = signingKey,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(2),
            RoleClaimType = ClaimTypes.Role,
            NameClaimType = ClaimTypes.NameIdentifier
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

// ---------- Middleware ----------
app.UseSwagger();
app.UseSwaggerUI();

// KHÔNG ép HTTPS trong container (tránh 301/https khi không gắn cert):
// app.UseHttpsRedirection();

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// ---------- Lắng nghe 8080 trong container ----------
app.Urls.Add("http://0.0.0.0:8080");

// ---------- Auto-migrate khi khởi động ----------
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<UserDBContext>();
    db.Database.Migrate();
}

app.Run();
