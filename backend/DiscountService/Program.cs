using Microsoft.EntityFrameworkCore;
using DiscountService.Model; // DiscountDBContext

var builder = WebApplication.CreateBuilder(args);

// 1) DB
var conn = Environment.GetEnvironmentVariable("ConnectionStrings__Default")
           ?? builder.Configuration.GetConnectionString("DefaultConnection")
           ?? builder.Configuration.GetConnectionString("Default");
builder.Services.AddDbContext<DiscountDBContext>(o => o.UseSqlServer(conn));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

// Không ép HTTPS trong container
// app.UseHttpsRedirection();

app.MapControllers();

// Expose 8080
app.Urls.Add("http://0.0.0.0:8080");

// Auto-migrate
using (var scope = app.Services.CreateScope())
{
    scope.ServiceProvider.GetRequiredService<DiscountDBContext>().Database.Migrate();
}

app.Run();
