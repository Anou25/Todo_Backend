using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Todo_Backend.Configurations;
using Todo_Backend.Models;
using Todo_Backend.Services;

namespace Todo_Backend.Middleware
{
    public class JwtMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly JwtSettings _jwtSettings;

        public JwtMiddleware(RequestDelegate next, IOptions<JwtSettings> jwtSettings)
        {
            _next = next;
            _jwtSettings = jwtSettings.Value;
        }

        public async Task Invoke(HttpContext context, MongoDbService mongoDbService)
        {
            var token = context.Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();
            if (!string.IsNullOrEmpty(token))
                await AttachUserToContext(context, mongoDbService, token);
            await _next(context);
        }

        private async Task AttachUserToContext(HttpContext context, MongoDbService mongoDbService, string token)
        {

            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.UTF8.GetBytes(_jwtSettings.Key);

                // Validating the token
                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidIssuer = _jwtSettings.Issuer,
                    ValidAudience = _jwtSettings.Audience,
                    ClockSkew = TimeSpan.Zero
                };

                //  Setting the ClaimsPrincipal on the HttpContext
                var principal = tokenHandler.ValidateToken(token, validationParameters, out SecurityToken validatedToken);
                context.User = principal;

                var jwtToken = (JwtSecurityToken)validatedToken;

                // Extract user claims
                var userId = jwtToken.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier)?.Value;

                // If userId is not found, or any claim validation fails, do not attach user
                if (string.IsNullOrEmpty(userId))
                {
                    throw new Exception("User ID claim not found.");
                }

                // Fetch the user from MongoDB
                var user = await mongoDbService.Users.Find(u => u.Id == userId).FirstOrDefaultAsync();
                if (user != null)
                {
                    // Attach the user to the context
                    context.Items["User"] = user;
                }
            }
            catch (Exception ex)
            {
                // Log exception or handle token validation failure
                Console.WriteLine($"JWT Validation Error: {ex.Message}");
                
            }
        }
    }
}