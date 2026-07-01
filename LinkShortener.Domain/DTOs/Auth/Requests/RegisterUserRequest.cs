namespace LinkShortener.Domain.DTOs.Auth.Requests
{
    public class RegisterUserRequest
    {
        public required string Email { get; set; }
        public required string Password { get; set; }
        public required string DisplayName { get; set; }
        public required int RegisterCode { get; set; }
    }
}
