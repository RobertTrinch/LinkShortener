using System;
using System.Collections.Generic;
using System.Text;

namespace LinkShortener.Domain.DTOs.ShortLink
{
    public class CreateShortLinkResponse
    {
        public required bool Success { get; set; }
        public required string Message { get; set; }
    }
}
