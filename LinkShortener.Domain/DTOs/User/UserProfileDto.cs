using System;
using System.Collections.Generic;
using System.Text;

namespace LinkShortener.Domain.DTOs.User
{
    public class UserProfileDto
    {
        public string DisplayName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
    }
}
