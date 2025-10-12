using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PaymentService.Model; // PaymentDBContext

var builder = WebApplication.CreateBuilder(args);

// 1) DB
var conn = Environment.GetEnvironmentVariable("ConnectionStrings__Default")
           ?? builder.Configuration.GetConnectionString("DefaultConnection")
           ?? builder.Configuration.GetConnectionString("Default");
builder.Services.AddDbContext<PaymentDBContext>(o => o.UseSqlServer(conn));

// 2) Controllers + Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 3) JWT
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

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

// Không bắt buộc HTTPS trong container
// app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Expose 8080
app.Urls.Add("http://0.0.0.0:8080");

// Auto-migrate
using (var scope = app.Services.CreateScope())
{
    scope.ServiceProvider.GetRequiredService<PaymentDBContext>().Database.Migrate();
}

app.Run();
