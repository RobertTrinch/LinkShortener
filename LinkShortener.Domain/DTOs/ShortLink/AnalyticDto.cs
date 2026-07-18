using System;
using System.Collections.Generic;
using System.Text;

namespace LinkShortener.Domain.DTOs.ShortLink
{
    public class AnalyticDto
    {
        public required int ShortLinkId { get; set; }
        public required string ShortLinkSlug { get; set; }
        public int? FolderId { get; set; }
        public string? FolderName { get; set; }
        public required DateTime ClickedAt { get; set; }
        public required string Referrer { get; set; }
        public required string IpCountry { get; set; }
    }
}
