using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using Todo_Backend.Models;
using Todo_Backend.Services;
using System.Security.Cryptography;


namespace Todo_Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    //[Authorize]
    public class UserController : ControllerBase
    {
        private readonly MongoDbService _mongoDbService;

        public UserController(MongoDbService mongoDbService)
        {
            _mongoDbService = mongoDbService;
        }
        [HttpPost("create")]
        [Authorize(Roles = "Admin")] // Only Admins can create users
        //[Authorize]
        //[AllowAnonymous]
        public async Task<IActionResult> CreateUser([FromBody] User user)
        {
            var existingUser = await _mongoDbService.Users.Find(u => u.Email == user.Email).FirstOrDefaultAsync();
            if (existingUser != null)
                return BadRequest("A user with this email already exists.");

            user.Password = HashPassword(user.Password);
            user.CreatedAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;
            user.IsActive = true;

            await _mongoDbService.Users.InsertOneAsync(user);
            return Ok("User created successfully.");
        }

        // Utility function to hash the password
        private string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(hashedBytes);
        }
        [HttpGet]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _mongoDbService.Users.Find(_ => true).ToListAsync();
            return Ok(users);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetUser(string id)
        {
            var user = await _mongoDbService.Users.Find(u => u.Id == id).FirstOrDefaultAsync();
            return user == null ? NotFound() : Ok(user);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(string id, [FromBody] User updatedUser)
        {
            var result = await _mongoDbService.Users.ReplaceOneAsync(u => u.Id == id, updatedUser);
            return result.ModifiedCount > 0 ? Ok("User updated") : NotFound();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            var result = await _mongoDbService.Users.DeleteOneAsync(u => u.Id == id);
            return result.DeletedCount > 0 ? Ok("User deleted") : NotFound();
        }
        [HttpGet("filter")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetUsersWithPaginationFiltering(
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 10,
    [FromQuery] string? search = null,
    [FromQuery] string? role = null,
    [FromQuery] bool? isActive = null)
        {
            try
            {
                var filterBuilder = Builders<User>.Filter;
                var filter = filterBuilder.Empty;

                // Search by name or email (case-insensitive)
                if (!string.IsNullOrEmpty(search))
                {
                    var regex = new MongoDB.Bson.BsonRegularExpression(search, "i");
                    filter &= filterBuilder.Or(
                        filterBuilder.Regex(u => u.FullName, regex),
                        filterBuilder.Regex(u => u.Email, regex)
                    );
                }

               

                // Filter by isActive status
                if (isActive.HasValue)
                {
                    filter &= filterBuilder.Eq(u => u.IsActive, isActive.Value);
                }

                var totalCount = await _mongoDbService.Users.CountDocumentsAsync(filter);

                var users = await _mongoDbService.Users
                    .Find(filter)
                    .Skip((page - 1) * pageSize)
                    .Limit(pageSize)
                    .ToListAsync();

                return Ok(new
                {
                    totalCount,
                    currentPage = page,
                    totalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                    data = users
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching users", error = ex.Message });
            }
        }

    }
}
