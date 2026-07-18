using LinkShortener.Domain.DTOs.Auth.Requests;
using LinkShortener.Domain.DTOs.Auth.Responses;
using LinkShortener.Domain.DTOs.User;
using LinkShortener.Domain.Helpers;
using LinkShortener.Domain.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace LinkShortener.Api.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class AuthController(AuthService authService) : ControllerBase
    {

        [HttpPost]
        public async Task<RegisterUserResponse> RegisterUser([FromBody] RegisterUserRequest dto)
        {
            return await authService.RegisterUser(dto);
        }

        [HttpPost]
        public async Task<IActionResult> LoginUser([FromBody] LoginUserRequest dto)
        {
            try
            {
                var loginData = await authService.LoginUser(dto.Email.ToLower().Trim(), dto.Password);

                Response.Cookies.Append("accessToken", loginData.AccessToken, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.None,
                    Expires = DateTimeOffset.UtcNow.AddHours(1)
                });

                Response.Cookies.Append("refreshToken", loginData.RefreshToken, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.None,
                    Expires = DateTimeOffset.UtcNow.AddDays(30)
                });

                return Ok();
            }
            catch (Exception ex) when (ex is UnauthorizedAccessException || ex is KeyNotFoundException)
            {
                return Unauthorized("Invalid username/password");
            }
        }

        [HttpDelete]
        public async Task<ActionResult> LogoutUser()
        {
            if (string.IsNullOrEmpty(Request.Cookies["refreshToken"]))
            {
                return BadRequest();
            }

            await authService.DeleteUserSession(Request.Headers.Authorization!);
            Response.Cookies.Delete("accessToken");
            Response.Cookies.Delete("refreshToken");
            return Ok(true);
        }
        
        [HttpGet]
        public async Task<ActionResult<UserProfileDto>> GetUserProfile()

        {
            var user = User.FindFirstValue(ClaimTypes.Name);
            if (string.IsNullOrEmpty(user))
            {
                return Unauthorized("User not authenticated");
            }
            return await authService.GetUserProfile(user);
        }

        [HttpPost]
        public async Task<IActionResult> RefreshToken()
        {
            var refreshToken = Request.Cookies["refreshToken"];

            if (string.IsNullOrEmpty(refreshToken))
            {
                Response.Cookies.Delete("accessToken");
                Response.Cookies.Delete("refreshToken");
                return Unauthorized("No refresh token provided");
            }

            try
            {
                var newAccessToken = await authService.RefreshToken(refreshToken);
                Response.Cookies.Append("accessToken", newAccessToken, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.None,
                    Expires = DateTimeOffset.UtcNow.AddHours(1)
                });
                return Ok();
            }
            catch (Exception ex) when (ex is UnauthorizedAccessException || ex is KeyNotFoundException)
            {
                Response.Cookies.Delete("accessToken");
                Response.Cookies.Delete("refreshToken");
                return Unauthorized(ex.Message);
            }
        }


    }
}
