using LinkShortener.Api.Middleware;
using LinkShortener.Domain.Database;
using Microsoft.EntityFrameworkCore;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Async(x => x.File("logs/log.log", retainedFileCountLimit: 30, rollingInterval: RollingInterval.Day))
    .WriteTo.Console()
    .CreateLogger();

Log.Information("Log setup");

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi

builder.Services.AddDbContext<DatabaseContext>(options =>
{
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection"));
});

var app = builder.Build();

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.UseMiddleware<ShortLinkRoutingMiddleware>();

app.MapControllers();

app.Run();
