using LinkShortener.Domain.Database;
using LinkShortener.Domain.DTOs.ShortLink;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace LinkShortener.Domain.Services
{
    public class ShortLinkService(DatabaseContext context)
    {
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

            if(string.IsNullOrEmpty(dto.Url))
            {
                return new CreateShortLinkResponse
                {
                    Success = false,
                    Message = "Url is empty"
                };
            }

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
                        Message = $"Slug {newSlug} created"
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
                        Message = $"Slug {dto.FolderName.ToLower()}/{newSlug} created"
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
                    Message = $"Slug {dto.Slug.ToLower()} created"
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
                    Message = $"Slug {dto.FolderName.ToLower()}/{dto.Slug} created"
                };
            }

        }
    }
}
