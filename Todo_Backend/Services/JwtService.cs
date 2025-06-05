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

            if (string.IsNullOrWhiteSpace(_jwtSettings.Key))
                throw new ArgumentNullException(nameof(_jwtSettings.Key), "JWT secret key cannot be null or empty.");
            if (string.IsNullOrWhiteSpace(_jwtSettings.Issuer))
                throw new ArgumentNullException(nameof(_jwtSettings.Issuer), "JWT issuer cannot be null or empty.");
            if (string.IsNullOrWhiteSpace(_jwtSettings.Audience))
                throw new ArgumentNullException(nameof(_jwtSettings.Audience), "JWT audience cannot be null or empty.");
        }

        public string GenerateToken(User user)
        {
            if (user == null)
                throw new ArgumentNullException(nameof(user), "User cannot be null.");

            if (string.IsNullOrWhiteSpace(user.Email))
                throw new ArgumentNullException(nameof(user.Email), "User email cannot be null or empty.");
            if (string.IsNullOrWhiteSpace(user.FullName))
                throw new ArgumentNullException(nameof(user.FullName), "User full name cannot be null or empty.");
            if (string.IsNullOrWhiteSpace(user.Role))
                throw new ArgumentNullException(nameof(user.Role), "User role cannot be null or empty.");

            // Claims included in the token
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()) // Unique token ID
            };

            // Create the security key and credentials
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Key));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            // Generate the token
            var tokenDescriptor = new JwtSecurityToken(
                issuer: _jwtSettings.Issuer,
                audience: _jwtSettings.Audience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(6),
                signingCredentials: creds
            );

            // Use JwtSecurityTokenHandler to create a valid dot-separated token string
            var tokenHandler = new JwtSecurityTokenHandler();
            var jwt = tokenHandler.WriteToken(tokenDescriptor);
            Console.WriteLine($"Generated Token: {jwt}");

            if (!jwt.Contains("."))
                throw new InvalidOperationException("Generated JWT is malformed: missing dot-separated segments.");

            return jwt;
        }
    }
}
