using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using UserService.Data;        // DbSeeder
using UserService.Model;       // UserDBContext
using UserService.Repository;  // IUserRepository, GenericRepository, UserRepository

var builder = WebApplication.CreateBuilder(args);

/* ============== 1) CONFIG & DB ============== */
var conn =
    builder.Configuration.GetConnectionString("UserDB")
 ?? builder.Configuration.GetConnectionString("Default")
 ?? "Server=sqlserver,1433;Database=UserDB;User Id=sa;Password=Lananh@123A;Encrypt=False;TrustServerCertificate=True";

builder.Services.AddDbContext<UserDBContext>(opt => opt.UseSqlServer(conn));
/* ============== 2) REPOSITORIES ============== */
builder.Services.AddScoped(typeof(IUserRepository<>), typeof(GenericRepository<>));
builder.Services.AddScoped<UserRepository>();

/* ============== 3) MVC & SWAGGER ============== */
// Controllers + Swagger (có Bearer)
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
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});


/* ============== 4) CORS (Dev FE) ============== */
builder.Services.AddCors(o => o.AddPolicy("dev", p =>
    p.WithOrigins("http://localhost:3000", "http://127.0.0.1:3000")
     .AllowAnyHeader()
     .AllowAnyMethod()
     .SetPreflightMaxAge(TimeSpan.FromHours(1))
));

/* ============== 5) AUTH (JWT) & POLICIES ============== */
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];
var jwtKey = builder.Configuration["Jwt:Key"] ?? "dev-secret-change-me";
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = signingKey,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(2),
            RoleClaimType = ClaimTypes.Role,
            NameClaimType = ClaimTypes.NameIdentifier
        };
    });

builder.Services.AddAuthorization(opts =>
{
    opts.AddPolicy("UserOnly", p => p.RequireAuthenticatedUser().RequireRole("User"));
    opts.AddPolicy("AdminOnly", p => p.RequireAuthenticatedUser().RequireRole("Admin"));
    opts.AddPolicy("UserOrAdmin", p => p.RequireAuthenticatedUser().RequireRole("User", "Admin"));
});

var app = builder.Build();

///* ============== 6) MIGRATE + SEED ============== */
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<UserDBContext>();
    await db.Database.MigrateAsync();
    await DbSeeder.SeedAsync(db);  // 1 admin (id=0, không address) + 2 user + 4 address
}

/* ============== 7) MIDDLEWARE PIPELINE ============== */

// Bật Swagger trong Dev (nếu muốn luôn bật, bỏ if)

app.UseSwagger();
app.UseSwaggerUI();

// Dev trong container chỉ HTTP:8080 -> KHÔNG redirect HTTPS
// app.UseHttpsRedirection();

app.UseCors("dev");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapGet("/health", () => "OK");

app.Run();
