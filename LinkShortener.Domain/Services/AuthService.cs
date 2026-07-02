using LinkShortener.Domain.Database;
using LinkShortener.Domain.Database.Models;
using LinkShortener.Domain.DTOs.Auth.Requests;
using LinkShortener.Domain.DTOs.Auth.Responses;
using LinkShortener.Domain.DTOs.User;
using LinkShortener.Domain.Helpers;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

namespace LinkShortener.Domain.Services
{
    public class AuthService(DatabaseContext context)
    {
        private readonly PasswordHasher<User> _passwordHasher = new();
        private readonly Regex _emailRegex = new Regex(@"^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$", RegexOptions.Compiled | RegexOptions.IgnoreCase);

        public async Task<RegisterUserResponse> RegisterUser(RegisterUserRequest dto)
        {
            try
            {
                var registerCode = await context.RegisterCodes.FirstOrDefaultAsync(x => x.Code == dto.RegisterCode && x.IsActive == true);
                if (registerCode == null)
                {
                    return new RegisterUserResponse
                    {
                        Success = false,
                        Message = "Invalid registration code."
                    };
                }

                if (!_emailRegex.IsMatch(dto.Email))
                {
                    return new RegisterUserResponse
                    {
                        Success = false,
                        Message = "Invalid email format."
                    };
                }

                if (registerCode.Email != dto.Email.ToLower())
                {
                    return new RegisterUserResponse
                    {
                        Success = false,
                        Message = "Invalid registration code."
                    };
                }

                if (string.IsNullOrEmpty(dto.DisplayName))
                {
                    return new RegisterUserResponse
                    {
                        Success = false,
                        Message = "Display name cannot be blank."
                    };
                }

                if (dto.Password.Length < 8)
                {
                    return new RegisterUserResponse
                    {
                        Success = false,
                        Message = "Password must be at least 8 characters long."
                    };
                }

                if (context.Users.Any(x => x.Email == dto.Email.ToLower()))
                {
                    return new RegisterUserResponse
                    {
                        Success = false,
                        Message = "Email already registered."
                    };
                }

                await context.Users.AddAsync(new User
                {
                    Email = dto.Email,
                    DisplayName = dto.DisplayName,
                    PasswordHash = _passwordHasher.HashPassword(new User(), dto.Password)
                });
                registerCode.IsActive = false; //todo: cant unactivate the code for some reason
                await context.SaveChangesAsync();
                LogHelper.LogInformation($"[AuthService.RegisterUser] Registered {dto.Email} ({dto.DisplayName}) using code {registerCode.Code}");
                return new RegisterUserResponse
                {
                    Success = true,
                    Message = "Registered successfully."
                };

            }

            catch (Exception ex)
            {
                LogHelper.LogFatal($"[AuthService.RegisterUser] Error registering user - {ex}");
                return new RegisterUserResponse
                {
                    Success = false,
                    Message = "An unknown error occurred while registering the user."
                };
            }
        }

        public async Task<LoginUserResponse> LoginUser(string email, string password)
        {
            var user = await context.Users.FirstOrDefaultAsync(x => x.Email == email.ToLower().Trim());
            if (user == null)
            {
                throw new KeyNotFoundException($"User with email {email} does not exist");
            }

            var isPassMatch = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, password) == PasswordVerificationResult.Success;
            if (!isPassMatch)
            {
                throw new UnauthorizedAccessException($"Incorrect password for {email}");
            }

            var token = GenerateJwtToken(user);
            var refreshToken = GenerateRefreshToken();

            await SaveRefreshToken(refreshToken, user.UserId);
            LogHelper.LogInformation($"[AuthService.LoginUser] User {email} logged in");
            return new LoginUserResponse
            {
                AccessToken = token,
                RefreshToken = refreshToken
            };
        }

        public async Task<UserProfileDto> GetUserProfile(string email)
        {
            var user = await context.Users.FirstOrDefaultAsync(x => x.Email == x.Email.ToLower().Trim());
            if (user == null)
            {
                throw new KeyNotFoundException($"User {email} does not exist");
            }

            return new UserProfileDto
            {
                Email = email,
                DisplayName = user.DisplayName
            };
        }

        private static string GenerateJwtToken(User user)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.Name, user.Email),
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString())
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Environment.GetEnvironmentVariable("linkshortener_jwtkey")!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: Environment.GetEnvironmentVariable("linkshortener_jwtissuer"),
                audience: Environment.GetEnvironmentVariable("linkshortener_jwtaudience"),
                claims: claims,
                expires: DateTime.UtcNow.AddHours(1),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public async Task<string> RefreshToken(string token)
        {
            var refreshToken = await context.UserRefreshTokens.FirstOrDefaultAsync(x => x.Token == token && x.ExpiresAt > DateTime.UtcNow);
            if (refreshToken == null)
            {
                LogHelper.LogInformation($"[Refresh Token] Invalid or expired refresh token {token}");
                throw new UnauthorizedAccessException("Invalid or expired refresh token.");
            }

            var user = await context.Users.FindAsync(refreshToken.UserId);

            if (user == null)
            {
                LogHelper.LogInformation($"[Refresh Token] User not found for refresh token {token}");
                throw new KeyNotFoundException("User not found for the provided refresh token.");
            }

            // Generate a new JWT token
            var newJwtToken = GenerateJwtToken(user);

            refreshToken.ExpiresAt = DateTime.UtcNow.AddDays(30);
            await context.SaveChangesAsync();

            LogHelper.LogInformation($"[Refresh Token] Refresh token {token} refreshed successfully");
            return newJwtToken;
        }

        public async Task DeleteUserSession(string token)
        {
            await context.UserRefreshTokens.Where(x => x.Token == token).ExecuteDeleteAsync();
            LogHelper.LogInformation($"[Logout User] Session {token} deleted");
        }

        private static string GenerateRefreshToken()
        {
            return Convert.ToBase64String(RandomNumberGenerator.GetBytes(128));
        }

        private async Task SaveRefreshToken(string token, int userId)
        {
            var refreshToken = new UserRefreshToken
            {
                Token = token,
                UserId = userId,
                ExpiresAt = DateTime.UtcNow.AddDays(30)
            };

            context.UserRefreshTokens.Add(refreshToken);
            await context.SaveChangesAsync();
        }

    }
}
