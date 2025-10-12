using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = WebApplication.CreateBuilder(args);

// Controllers + bật Newtonsoft.Json cho model binding/serialize
builder.Services
    .AddControllers()
    .AddNewtonsoftJson();

// Swagger (nếu bạn đang dùng, để tiện test local)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHttpClient();
var app = builder.Build();

if (app.Environment.IsDevelopment() || 
    string.Equals(builder.Configuration["ASPNETCORE_ENVIRONMENT"], "Docker", System.StringComparison.OrdinalIgnoreCase))
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseRouting();
app.UseAuthorization();

app.MapControllers();

app.Run();
