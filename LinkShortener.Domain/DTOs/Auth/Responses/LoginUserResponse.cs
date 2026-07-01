namespace LinkShortener.Domain.DTOs.Auth.Responses
{
    public class LoginUserResponse
    {
        public required string AccessToken { get; set; }

        public required string RefreshToken { get; set; }
    }
}
