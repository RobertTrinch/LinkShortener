using LinkShortener.Domain.Database;
using LinkShortener.Domain.Database.Models;
using LinkShortener.Domain.DTOs.Auth.Responses;
using LinkShortener.Domain.DTOs.ShortLink;
using LinkShortener.Domain.Helpers;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;
using System.Text.RegularExpressions;

namespace LinkShortener.Domain.Services
{
    public class ShortLinkService(DatabaseContext context)
    {

        //private readonly Regex _urlRegex = new Regex(@"/^[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/", RegexOptions.Compiled | RegexOptions.IgnoreCase);

        public async Task<CreateShortLinkResponse> CreateShortLink(CreateShortLinkRequest dto, int userId)
        {
            var user = await context.Users.FirstOrDefaultAsync(x => x.UserId == userId);
            if (user == null)
            {
                return new CreateShortLinkResponse
                {
                    Success = false,
                    Message = "User does not exist?"
                };
            }

            if (string.IsNullOrEmpty(dto.Url))
            {
                return new CreateShortLinkResponse
                {
                    Success = false,
                    Message = "URL is empty"
                };
            }

            /*if (!_urlRegex.IsMatch(dto.Url))
            {
                return new CreateShortLinkResponse
                {
                    Success = false,
                    Message = "Invalid URL format."
                };
            }
            */

            // if slug is left empty
            if (string.IsNullOrEmpty(dto.Slug))
            {
                var newSlug = Guid.NewGuid().ToString("n").Substring(0, 8).ToLower();
                var shortLink2 = await context.ShortLinks.FirstOrDefaultAsync(x => x.Slug == newSlug && x.Folder == null);
                if (shortLink2 != null)
                {
                    return new CreateShortLinkResponse
                    {
                        Success = false,
                        Message = $"Slug {newSlug} already exists."
                    };
                }
                if (string.IsNullOrEmpty(dto.FolderName))
                {
                    await context.ShortLinks.AddAsync(new Database.Models.ShortLink
                    {
                        UserId = userId,
                        CreatedAt = DateTime.Now,
                        FolderId = null,
                        Slug = newSlug.ToLower(),
                        Url = dto.Url
                    });
                    await context.SaveChangesAsync();
                    return new CreateShortLinkResponse
                    {
                        Success = true,
                        Message = $"{newSlug}"
                    };
                }
                // if folder is contained
                else
                {
                    var folder = await context.Folders.FirstOrDefaultAsync(x => x.Slug == dto.FolderName.ToLower());

                    if (folder == null)
                    {
                        await context.Folders.AddAsync(new Database.Models.Folder
                        {
                            UserId = userId,
                            CreatedAt = DateTime.Now,
                            Slug = dto.FolderName.ToLower()
                        });
                        await context.SaveChangesAsync();
                        folder = await context.Folders.FirstOrDefaultAsync(x => x.Slug == dto.FolderName.ToLower());
                    }

                    await context.ShortLinks.AddAsync(new Database.Models.ShortLink
                    {
                        UserId = userId,
                        CreatedAt = DateTime.Now,
                        FolderId = folder.FolderId,
                        Slug = newSlug.ToLower(),
                        Url = dto.Url
                    });
                    await context.SaveChangesAsync();
                    return new CreateShortLinkResponse
                    {
                        Success = true,
                        Message = $"{dto.FolderName.ToLower()}/{newSlug}"
                    };
                }
            }

            // if folder empty
            if (string.IsNullOrEmpty(dto.FolderName))
            {
                var shortLink = await context.ShortLinks.FirstOrDefaultAsync(x => x.Slug == dto.Slug.ToLower() && x.Folder == null);
                if (shortLink != null)
                {
                    return new CreateShortLinkResponse
                    {
                        Success = false,
                        Message = $"Slug {dto.Slug} already exists."
                    };
                }

                await context.ShortLinks.AddAsync(new Database.Models.ShortLink
                {
                    UserId = userId,
                    CreatedAt = DateTime.Now,
                    FolderId = null,
                    Slug = dto.Slug.ToLower(),
                    Url = dto.Url
                });
                await context.SaveChangesAsync();
                return new CreateShortLinkResponse
                {
                    Success = true,
                    Message = $"{dto.Slug.ToLower()}"
                };

            }
            // if folder is contained
            else
            {

                // look for folder, if not existent, create.
                var folder = await context.Folders.FirstOrDefaultAsync(x => x.Slug == dto.FolderName.ToLower());

                if (folder == null)
                {
                    await context.Folders.AddAsync(new Database.Models.Folder
                    {
                        UserId = userId,
                        CreatedAt = DateTime.Now,
                        Slug = dto.FolderName.ToLower()
                    });
                    await context.SaveChangesAsync();
                    folder = await context.Folders.FirstOrDefaultAsync(x => x.Slug == dto.FolderName.ToLower());
                }

                var shortLink = await context.ShortLinks.FirstOrDefaultAsync(x => x.Slug == dto.Slug.ToLower() && x.Folder == folder);
                if (shortLink != null)
                {
                    return new CreateShortLinkResponse
                    {
                        Success = false,
                        Message = $"Slug {dto.FolderName}/{dto.Slug} already exists."
                    };
                }

                await context.ShortLinks.AddAsync(new Database.Models.ShortLink
                {
                    UserId = userId,
                    CreatedAt = DateTime.Now,
                    FolderId = folder.FolderId,
                    Slug = dto.Slug.ToLower(),
                    Url = dto.Url
                });
                await context.SaveChangesAsync();
                return new CreateShortLinkResponse
                {
                    Success = true,
                    Message = $"{dto.FolderName.ToLower()}/{dto.Slug.ToLower()}"
                };
            }

        }

        public async Task<ShortLinkDto> GetShortLinkInfo(int shortLinkId)
        {
            var link = await context.ShortLinks.Where(x => x.ShortLinkId == shortLinkId).FirstOrDefaultAsync();
            ShortLinkDto shortLink;
            if (link == null)
            {
                LogHelper.LogInformation("link is null");
                return null;
            }

            if (link.FolderId != null)
            {
                LogHelper.LogInformation("folder");
                shortLink = new ShortLinkDto
                {
                    ShortLinkId = link.ShortLinkId,
                    CreatedAt = link.CreatedAt,
                    Slug = link.Slug,
                    Url = link.Url,
                    User = new DTOs.ShortLink.User { DisplayName = link.User?.DisplayName, UserId = link.UserId },
                    Folder = new DTOs.ShortLink.Folder { FolderId = link.FolderId.Value, FolderName = link.Folder?.Slug }
                };
            }
            else
            {
                LogHelper.LogInformation("no folder");
                shortLink = new ShortLinkDto
                {
                    ShortLinkId = link.ShortLinkId,
                    CreatedAt = link.CreatedAt,
                    Slug = link.Slug,
                    Url = link.Url,
                    User = new DTOs.ShortLink.User { DisplayName = link.User?.DisplayName, UserId = link.UserId }
                };
            }

            var analytics = context.ClickAnalytics.Where(x => x.ShortLinkId == link.ShortLinkId).ToList();
            List<Analytics> analyticsList = new List<Analytics>();
            foreach(var analytic in analytics)
            {
                LogHelper.LogInformation("added analytic");
                analyticsList.Add(new Analytics { ClickedAt = analytic.ClickedAt, IpCountry = analytic.IpCountry, Referrer = analytic.Referrer });
            }

            shortLink.Analytics = analyticsList;
            LogHelper.LogInformation(shortLink.Url);
            return shortLink;

        }

        public async Task<List<AnalyticDto>> GetLast30Days()
        {
            var list = new List<AnalyticDto>();

            var clicks = await context.ClickAnalytics
                .Include(c => c.ShortLink).ThenInclude(sl => sl.Folder)
                .Where(x => x.ClickedAt >= DateTime.UtcNow.AddDays(-30))
                .OrderByDescending(x => x.ClickedAt)
                .ToListAsync();

            foreach (var click in clicks)
            {
                list.Add(new AnalyticDto
                {
                    ShortLinkId = click.ShortLinkId,
                    ShortLinkSlug = click.ShortLink?.Slug ?? string.Empty,
                    FolderId = click.ShortLink?.FolderId,
                    FolderName = click.ShortLink?.Folder?.Slug,
                    ClickedAt = click.ClickedAt,
                    Referrer = click.Referrer ?? string.Empty,
                    IpCountry = click.IpCountry ?? string.Empty
                });
            }

            return list;
        }

        public async Task<List<ShortLinkDto>> GetShortLinkList()
        {
            var linkList = new List<ShortLinkDto>();

            var links = await context.ShortLinks
                .Include(l => l.User)
                .Include(l => l.Folder)
                .ToListAsync();

            foreach (var link in links)
            {
                if (link.FolderId != null)
                {
                    linkList.Add(new ShortLinkDto
                    {
                        ShortLinkId = link.ShortLinkId,
                        CreatedAt = link.CreatedAt,
                        Slug = link.Slug,
                        Url = link.Url,
                        User = new DTOs.ShortLink.User { DisplayName = link.User?.DisplayName, UserId = link.UserId },
                        Folder = new DTOs.ShortLink.Folder { FolderId = link.FolderId.Value, FolderName = link.Folder?.Slug }
                    });
                }
                else
                {
                    linkList.Add(new ShortLinkDto
                    {
                        ShortLinkId = link.ShortLinkId,
                        CreatedAt = link.CreatedAt,
                        Slug = link.Slug,
                        Url = link.Url,
                        User = new DTOs.ShortLink.User { DisplayName = link.User?.DisplayName, UserId = link.UserId }
                    });
                }
            }

            return linkList;
        }

        public async Task<CreateShortLinkResponse> EditShortLink(int shortLinkId, CreateShortLinkRequest dto, int userId)
        {
            var link = await context.ShortLinks.Include(l => l.Folder).FirstOrDefaultAsync(x => x.ShortLinkId == shortLinkId);
            if (link == null)
            {
                return new CreateShortLinkResponse { Success = false, Message = "ShortLink not found." };
            }
            // handle folder
            Database.Models.Folder? folder = null;
            if (!string.IsNullOrEmpty(dto.FolderName))
            {
                folder = await context.Folders.FirstOrDefaultAsync(x => x.Slug == dto.FolderName.ToLower());
                if (folder == null)
                {
                    await context.Folders.AddAsync(new Database.Models.Folder
                    {
                        UserId = userId,
                        CreatedAt = DateTime.Now,
                        Slug = dto.FolderName.ToLower()
                    });
                    await context.SaveChangesAsync();
                    folder = await context.Folders.FirstOrDefaultAsync(x => x.Slug == dto.FolderName.ToLower());
                }
            }

            // ensure slug uniqueness
            if (!string.IsNullOrEmpty(dto.Slug))
            {
                var existing = string.IsNullOrEmpty(dto.FolderName)
                    ? await context.ShortLinks.FirstOrDefaultAsync(x => x.Slug == dto.Slug.ToLower() && x.FolderId == null && x.ShortLinkId != shortLinkId)
                    : await context.ShortLinks.FirstOrDefaultAsync(x => x.Slug == dto.Slug.ToLower() && x.FolderId == folder.FolderId && x.ShortLinkId != shortLinkId);

                if (existing != null)
                {
                    return new CreateShortLinkResponse { Success = false, Message = "Slug already exists." };
                }
            }

            // apply changes
            if (!string.IsNullOrEmpty(dto.Slug)) link.Slug = dto.Slug.ToLower();
            if (!string.IsNullOrEmpty(dto.Url)) link.Url = dto.Url;
            link.FolderId = folder?.FolderId;

            context.ShortLinks.Update(link);
            await context.SaveChangesAsync();

            var message = link.FolderId != null ? $"{link.Folder?.Slug}/{link.Slug}" : link.Slug;
            return new CreateShortLinkResponse { Success = true, Message = message };
        }

        public async Task<CreateShortLinkResponse> DeleteShortLink(int shortLinkId)
        {
            var link = await context.ShortLinks.FirstOrDefaultAsync(x => x.ShortLinkId == shortLinkId);
            if (link == null)
            {
                return new CreateShortLinkResponse { Success = false, Message = "ShortLink not found." };
            }

            var analytics = context.ClickAnalytics.Where(x => x.ShortLinkId == shortLinkId);
            context.ClickAnalytics.RemoveRange(analytics);
            context.ShortLinks.Remove(link);
            await context.SaveChangesAsync();

            return new CreateShortLinkResponse { Success = true, Message = "Deleted" };
        }

    }
}
