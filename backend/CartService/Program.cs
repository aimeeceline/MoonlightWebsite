using System.Security.Claims;
using System.Text;
using System.IdentityModel.Tokens.Jwt;        // 👈 thêm
using CartService.Model;
using CartService.Repository;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Giữ nguyên tên claim như trong JWT, không auto-map
JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

// ===== DB =====
var conn = builder.Configuration.GetConnectionString("CartDB")
    ?? "Server=sqlserver,1433;Database=CartDB;User Id=sa;Password=Lananh@123A;Encrypt=False;TrustServerCertificate=True";
builder.Services.AddDbContext<CartDBContext>(o => o.UseSqlServer(conn));

// ===== DI =====
builder.Services.AddScoped(typeof(ICartRepository<>), typeof(GenericRepository<>));
builder.Services.AddScoped<CartRepository>();
builder.Services.AddScoped<CartItemRepository>();
builder.Services.AddHttpContextAccessor();
builder.Services.Configure<ServiceUrls>(builder.Configuration.GetSection("Services"));
builder.Services.AddHttpClient<ApiClientHelper>(); // typed client

// ===== MVC + Swagger =====
builder.Services.AddControllers().AddNewtonsoftJson();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "CartService API", Version = "v1" });
    var bearer = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Description = "Dán CHỈ chuỗi JWT (KHÔNG gõ 'Bearer '). Swagger sẽ tự thêm.",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
    };
    c.AddSecurityDefinition("Bearer", bearer);
    c.AddSecurityRequirement(new OpenApiSecurityRequirement { { bearer, Array.Empty<string>() } });
});

// ===== CORS dev =====
builder.Services.AddCors(p => p.AddPolicy("dev", b => b
    .WithOrigins("http://localhost:3000", "http://127.0.0.1:3000", "https://localhost:3000")
    .AllowAnyHeader().AllowAnyMethod()
));

// ===== JWT =====
var jwt = builder.Configuration.GetSection("Jwt");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.RequireHttpsMetadata = false;
        o.SaveToken = true;
        o.TokenValidationParameters = new()
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt["Issuer"],
            ValidAudience = jwt["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Key"]!)),
            ClockSkew = TimeSpan.Zero,
            NameClaimType = ClaimTypes.NameIdentifier,   // 👈 cố định
            RoleClaimType = ClaimTypes.Role
        };
    });

builder.Services.AddAuthorization(opts =>
{
    opts.AddPolicy("UserOnly", p => p.RequireAuthenticatedUser().RequireRole("User"));
    opts.AddPolicy("AdminOnly", p => p.RequireAuthenticatedUser().RequireRole("Admin"));
    opts.AddPolicy("UserOrAdmin", p => p.RequireAuthenticatedUser().RequireRole("User", "Admin"));
});

var app = builder.Build();

// ===== Auto-migrate =====
using (var scope = app.Services.CreateScope())
    await scope.ServiceProvider.GetRequiredService<CartDBContext>().Database.MigrateAsync();

// ===== Pipeline =====
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "CartService v1");
    c.RoutePrefix = "swagger";
});

// app.UseHttpsRedirection();
app.UseCors("dev");
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// ===== Endpoints debug =====
app.MapGet("/debug/claims", (ClaimsPrincipal u) =>
    u.Claims.Select(c => new { c.Type, c.Value })
).RequireAuthorization();

app.MapGet("/whoami", (ClaimsPrincipal u) => new
{
    id = u.FindFirstValue(ClaimTypes.NameIdentifier)
       ?? u.FindFirstValue("uid")
       ?? u.FindFirstValue(JwtRegisteredClaimNames.Sub)
       ?? "(null)",
    role = u.FindFirstValue(ClaimTypes.Role) ?? "(null)"
}).RequireAuthorization("UserOnly");

app.Run();

public record ServiceUrls
{
    public string? UserService { get; init; }
    public string? ProductService { get; init; }
    public string? DiscountService { get; init; }
}
