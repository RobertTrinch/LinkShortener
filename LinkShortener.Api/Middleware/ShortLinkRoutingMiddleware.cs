using LinkShortener.Domain.Database;
using LinkShortener.Domain.Helpers;
using Microsoft.EntityFrameworkCore;

namespace LinkShortener.Api.Middleware
{
    public class ShortLinkRoutingMiddleware(RequestDelegate next)
    {
        public async Task InvokeAsync(HttpContext context, DatabaseContext dbContext)
        {
            var path = context.Request.Path.Value?.Trim('/');
            if (string.IsNullOrWhiteSpace(path) || path.StartsWith("api/") || path.StartsWith("swagger/"))
            {
                await next(context);
                return;
            }

            var segments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
            if (segments.Length == 1)
            {
                var slug = segments[0].ToLower();
                var link = await dbContext.ShortLinks.FirstOrDefaultAsync(x => x.Slug == slug && x.FolderId == null);

                if (link != null)
                {
                    TriggerRedirect(context, link.Url);
                    return;
                }
            }

            if(segments.Length == 2)
            {
                var folderSlug = segments[0].ToLower();
                var linkSlug = segments[1].ToLower();

                var link = await dbContext.ShortLinks.FirstOrDefaultAsync(x => x.Slug == linkSlug && x.Folder != null && x.Folder!.Slug == folderSlug);
                if (link != null)
                {
                    TriggerRedirect(context, link.Url);
                    return;
                }
            }

            await next(context);
        }

        private static void TriggerRedirect(HttpContext context, string destinationUrl)
        {
            context.Response.StatusCode = StatusCodes.Status302Found;
            context.Response.Headers.Location = destinationUrl;
        }
    }
}
