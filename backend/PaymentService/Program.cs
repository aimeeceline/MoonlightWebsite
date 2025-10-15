using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using PaymentService.Model;
using PaymentService.Repository;

var builder = WebApplication.CreateBuilder(args);

// ===== DB =====
var conn = builder.Configuration.GetConnectionString("PaymentDB")
    ?? "Server=sqlserver,1433;Database=PaymentDB;User Id=sa;Password=Lananh@123A;Encrypt=False;TrustServerCertificate=True";
builder.Services.AddDbContext<PaymentDBContext>(o => o.UseSqlServer(conn));

// ===== DI =====
builder.Services.AddHttpClient<ApiClientHelper>();     // để gọi Order/User/... nếu cần
builder.Services.AddHttpContextAccessor();
builder.Services.Configure<ServiceUrls>(builder.Configuration.GetSection("Services"));

// ===== MVC + Newtonsoft =====
builder.Services.AddControllers().AddNewtonsoftJson(o =>
{
    // Cho thống nhất FE: camelCase
    o.SerializerSettings.ContractResolver =
        new Newtonsoft.Json.Serialization.CamelCasePropertyNamesContractResolver();
});

// ===== Swagger =====
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "PaymentService API", Version = "v1" });
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
    c.AddSecurityRequirement(new OpenApiSecurityRequirement { { scheme, Array.Empty<string>() } });
});

// ===== CORS dev =====
builder.Services.AddCors(p => p.AddPolicy("dev", b => b
    .WithOrigins("http://localhost:3000", "http://127.0.0.1:3000", "https://localhost:3000")
    .AllowAnyHeader().AllowAnyMethod()
));

// ===== JWT (nếu Payment cần auth) =====
var jwt = builder.Configuration.GetSection("Jwt");
if (!string.IsNullOrEmpty(jwt["Key"]))
{
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
                ClockSkew = TimeSpan.Zero
            };
        });
}

var app = builder.Build();

// Auto-migrate (tùy bạn dùng hay không)
using (var scope = app.Services.CreateScope())
    await scope.ServiceProvider.GetRequiredService<PaymentDBContext>().Database.MigrateAsync();

// pipeline
app.UseSwagger();
app.UseSwaggerUI(c => { c.SwaggerEndpoint("/swagger/v1/swagger.json", "PaymentService v1"); c.RoutePrefix = "swagger"; });

app.UseCors("dev");
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.MapGet("/healthz", () => new { ok = true, at = DateTime.UtcNow });

app.Run();

// map section Services
public record ServiceUrls
{
    public string? OrderService { get; init; }
    public string? CartService { get; init; }
    public string? UserService { get; init; }
    public string? ProductService { get; init; }
}
