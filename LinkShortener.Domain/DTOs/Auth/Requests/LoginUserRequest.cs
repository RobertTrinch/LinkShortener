using System;
using System.Collections.Generic;
using System.Text;

namespace LinkShortener.Domain.DTOs.Auth.Requests
{
    public class LoginUserRequest
    {
        public required string Email { get; set; }
        public required string Password { get; set; }
    }
}
