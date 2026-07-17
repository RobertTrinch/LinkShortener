using LinkShortener.Domain.Database.Models;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace LinkShortener.Domain.DTOs.ShortLink
{
    public class CreateShortLinkRequest
    {
        public required string Slug { get; set; }
        public required string Url { get; set; }
        public string? FolderName { get; set; }
    }
}
