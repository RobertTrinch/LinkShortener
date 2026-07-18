using LinkShortener.Domain.Database.Models;
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

            var req = await shortLinkService.CreateShortLink(request, int.Parse(userId));
            if(req.Success)
            {
#if DEBUG
                req.Message = "https://localhost:7113/" + req.Message;
#else
                req.Message = "https://go.trinch.net/" + req.Message;
#endif
            }
            return req;
        }

        [Authorize]
        [HttpGet]
        public async Task<List<ShortLinkDto>> GetAllShortLinks()
        {
            return await shortLinkService.GetShortLinkList();
        }

        [Authorize]
        [HttpGet]
        public async Task<ShortLinkDto> GetShortLinkInfo(int shortLinkId)
        {
            return await shortLinkService.GetShortLinkInfo(shortLinkId);
        }

        [Authorize]
        [HttpPut]
        public async Task<CreateShortLinkResponse> EditShortLink(int shortLinkId, [FromBody] CreateShortLinkRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                throw new Exception("User not authorized?");
            }

            return await shortLinkService.EditShortLink(shortLinkId, request, int.Parse(userId));
        }

        [Authorize]
        [HttpDelete]
        public async Task<CreateShortLinkResponse> DeleteShortLink(int shortLinkId)
        {
            return await shortLinkService.DeleteShortLink(shortLinkId);
        }

        [Authorize]
        [HttpGet]
        public async Task<List<AnalyticDto>> GetLast30Days()
        {
            return await shortLinkService.GetLast30Days();
        }

    }
}
