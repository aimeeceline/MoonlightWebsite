using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using PaymentService.Model;

var builder = WebApplication.CreateBuilder(args);

/* ============== DB ============== */
var conn =
    builder.Configuration.GetConnectionString("PaymentDB")
 ?? "Server=sqlserver,1433;Database=PaymentDB;User Id=sa;Password=Lananh@123A;Encrypt=False;TrustServerCertificate=True";

builder.Services.AddDbContext<PaymentDBContext>(o => o.UseSqlServer(conn));

/* ============== Settings ============== */
builder.Services.Configure<ServiceUrls>(builder.Configuration.GetSection("Services"));
builder.Services.Configure<PaymentSettings>(builder.Configuration.GetSection("Payment"));

/* ============== Infra ============== */
builder.Services.AddHttpClient();
builder.Services.AddHttpContextAccessor();

/* ============== Controllers + JSON ============== */
builder.Services.AddControllers().AddNewtonsoftJson(o =>
{
    o.SerializerSettings.ContractResolver =
        new Newtonsoft.Json.Serialization.CamelCasePropertyNamesContractResolver();
});

/* ============== Swagger ============== */
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

/* ============== CORS Dev ============== */
builder.Services.AddCors(p => p.AddPolicy("dev", b => b
    .WithOrigins("http://localhost:3000", "http://127.0.0.1:3000", "https://localhost:3000")
    .AllowAnyHeader().AllowAnyMethod()
));

/* ============== (Optional) JWT ============== */
var jwt = builder.Configuration.GetSection("Jwt");
if (!string.IsNullOrWhiteSpace(jwt["Key"]))
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
builder.Services.AddAuthorization(opts =>
{
    opts.AddPolicy("UserOnly", p => p.RequireAuthenticatedUser().RequireRole("User"));
    opts.AddPolicy("AdminOnly", p => p.RequireAuthenticatedUser().RequireRole("Admin"));
    opts.AddPolicy("UserOrAdmin", p => p.RequireAuthenticatedUser().RequireRole("User", "Admin"));

    // 👇 THÊM: chỉ tài khoản đang hoạt động (JWT phải có claim is_active=true)
    opts.AddPolicy("ActiveUser", p => p.RequireAuthenticatedUser().RequireClaim("is_active", "true"));
});
var app = builder.Build();

/* ============== Auto-migrate ============== */
using (var scope = app.Services.CreateScope())
    await scope.ServiceProvider.GetRequiredService<PaymentDBContext>().Database.MigrateAsync();

/* ============== Pipeline ============== */
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "PaymentService v1");
    c.RoutePrefix = "swagger";
});

app.UseCors("dev");
// app.UseHttpsRedirection();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.MapGet("/healthz", () => new { ok = true, at = DateTime.UtcNow });

app.Run();

/* ============== Records ============== */
public record ServiceUrls
{
    public string? OrderService { get; init; }  
}

public record PaymentSettings
{
    public string? SepayApiBase { get; init; }      // mặc định: https://my.sepay.vn
    public string? SepayApiToken { get; init; }     // token SEPay (đặt trong secrets/env)
    public string? BankCode { get; init; }          // "970418"
    public string? AccountNumber { get; init; }     // "962470356635602"
    public int QrExpireSeconds { get; init; } = 120;
}
