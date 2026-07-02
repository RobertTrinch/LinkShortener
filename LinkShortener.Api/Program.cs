using LinkShortener.Api.Middleware;
using LinkShortener.Domain.Database;
using LinkShortener.Domain.Helpers;
using LinkShortener.Domain.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder => builder.WithOrigins("http://localhost:3000", "https://godashboard.trinch.net")
        .AllowAnyMethod().AllowAnyHeader().AllowCredentials());
});

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<DatabaseContext>(options =>
{
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection"));
});

builder.Services.AddScoped<AuthService>();

builder.Services.AddAuthorization();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = Environment.GetEnvironmentVariable("linkshortener_jwtissuer"),
            ValidAudience = Environment.GetEnvironmentVariable("linkshortener_jwtaudience"),
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Environment.GetEnvironmentVariable("linkshortener_jwtkey")!))
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                if (string.IsNullOrEmpty(context.Token))
                {
                    if (context.Request.Cookies.TryGetValue("accessToken", out var tokenFromCookie))
                    {
                        context.Token = tokenFromCookie;
                    }
                }
                return Task.CompletedTask;
            }
        };
    });

var app = builder.Build();


if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.UseMiddleware<ShortLinkRoutingMiddleware>();

app.MapControllers();

LogHelper.LogInformation("App Started");
app.Run();