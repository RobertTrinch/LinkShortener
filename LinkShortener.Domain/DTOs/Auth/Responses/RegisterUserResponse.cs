namespace LinkShortener.Domain.DTOs.Auth.Responses
{
    public class RegisterUserResponse
    {
        public required bool Success { get; set; }
        public required string Message { get; set; }
    }
}
