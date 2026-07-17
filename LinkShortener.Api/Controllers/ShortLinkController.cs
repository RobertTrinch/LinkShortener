using LinkShortener.Domain.DTOs.ShortLink;
using LinkShortener.Domain.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace LinkShortener.Api.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class ShortLinkController(ShortLinkService shortLinkService) : ControllerBase
    {

        [Authorize]
        [HttpPost]
        public async Task<CreateShortLinkResponse> CreateShortLink([FromBody] CreateShortLinkRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                throw new Exception("User not authorized?");
            }

            return await shortLinkService.CreateShortLink(request, int.Parse(userId));
        }

    }
}
