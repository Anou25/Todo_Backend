using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using Todo_Backend.Models;
using Todo_Backend.Services;
using System.Security.Cryptography;
using System.Text;

namespace Todo_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly MongoDbService _mongoDbService;
        private readonly JwtService _jwtService;

        public AuthController(MongoDbService mongoDbService, JwtService jwtService)
        {
            _mongoDbService = mongoDbService;
            _jwtService = jwtService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            var existingUser = await _mongoDbService.Users.Find(u => u.Email == request.Email).FirstOrDefaultAsync();
            if (existingUser != null)
                return BadRequest("User already exists.");

            var newUser = new User
            {
                FullName = request.FullName,
                Email = request.Email,
                Password = HashPassword(request.Password),
                Role = string.IsNullOrWhiteSpace(request.Role) ? "User" : request.Role,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _mongoDbService.Users.InsertOneAsync(newUser);
            return Ok("Registration successful");
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var user = await _mongoDbService.Users.Find(u => u.Email == request.Email).FirstOrDefaultAsync();
            if (user == null || user.Password != HashPassword(request.Password))
                return Unauthorized("Invalid email or password.");

            if (!user.IsActive)
                return Unauthorized("Account is disabled.");

            var token = _jwtService.GenerateToken(user);
            return Ok(new { token, role = user.Role });
        }

        private string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(hashedBytes);
        }
    }

    public class RegisterRequest
    {
        public string FullName { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string Role { get; set; } // Optional: "Admin" or "User"
    }

    public class LoginRequest
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }
}
