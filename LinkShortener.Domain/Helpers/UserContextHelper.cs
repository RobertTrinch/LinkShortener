using LinkShortener.Domain.Database;
using LinkShortener.Domain.Database.Models;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace LinkShortener.Domain.Helpers
{
    public class UserContextHelper(IHttpContextAccessor httpContextAccessor, DatabaseContext context)
    {
        public string GetUserId()
        {
            return httpContextAccessor.HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)!.Value;
        }

        public string GetUserFirstName()
        {
            return httpContextAccessor.HttpContext.User.FindFirst(ClaimTypes.Name)!.Value;
        }

        public User GetUser()
        {
            var userId = GetUserId();
            return context.Users.Find(userId)!;
        }
    }
}
