using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Todo_Backend.Configurations;
using Todo_Backend.Models;
using System;

namespace Todo_Backend.Services
{
    public class JwtService
    {
        private readonly JwtSettings _jwtSettings;

        public JwtService(IOptions<JwtSettings> jwtOptions)
        {
            _jwtSettings = jwtOptions.Value;

            // Ensuring the JWT settings are correctly populated
            if (string.IsNullOrWhiteSpace(_jwtSettings.Key))
                throw new ArgumentNullException(nameof(_jwtSettings.Key), "JWT secret key cannot be null or empty.");
            if (string.IsNullOrWhiteSpace(_jwtSettings.Issuer))
                throw new ArgumentNullException(nameof(_jwtSettings.Issuer), "JWT issuer cannot be null or empty.");
            if (string.IsNullOrWhiteSpace(_jwtSettings.Audience))
                throw new ArgumentNullException(nameof(_jwtSettings.Audience), "JWT audience cannot be null or empty.");
        }

        public string GenerateToken(User user)
        {
            // Validating that the user object is not null and that the required fields are not empty
            if (user == null)
                throw new ArgumentNullException(nameof(user), "User cannot be null.");

            if (string.IsNullOrWhiteSpace(user.Email))
                throw new ArgumentNullException(nameof(user.Email), "User email cannot be null or empty.");

            if (string.IsNullOrWhiteSpace(user.FullName))
                throw new ArgumentNullException(nameof(user.FullName), "User full name cannot be null or empty.");

            if (string.IsNullOrWhiteSpace(user.Role))
                throw new ArgumentNullException(nameof(user.Role), "User role cannot be null or empty.");

            // Preparing claims (including role)
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()), // Convert ObjectId to string
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim(ClaimTypes.Role, user.Role) // Role for authorization
            };

            // Defining signing credentials using the secret key from the settings
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Key));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            // Generation of the token
            var token = new JwtSecurityToken(
                issuer: _jwtSettings.Issuer,
                audience: _jwtSettings.Audience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(6),  // Token expiry set to 6 hours
                signingCredentials: creds);

            // Return the token as a string
            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
