using System;
using System.Collections.Generic;
using System.Text;

namespace LinkShortener.Domain.DTOs.ShortLink
{
    public class ShortLinkDto
    {
        public required int ShortLinkId { get; set; }
        public required DateTime CreatedAt { get; set; }
        public required string Slug { get; set; }
        public required string Url { get; set; }
        public required User User { get; set; }
        public Folder? Folder { get; set; }
        public List<Analytics>? Analytics { get; set; }

    }

    public class Analytics
    {
        public required DateTime ClickedAt { get; set; }
        public required string Referrer { get; set; }
        public required string IpCountry { get; set; }
    }

    public class User
    {
        public required int UserId { get; set; }
        public required string DisplayName { get; set; }
    }

    public class Folder
    {
        public required int FolderId { get; set; }
        public required string FolderName { get; set; }
    }

}
