using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using Todo_Backend.Models;
using Todo_Backend.Services;
using System.Security.Cryptography;
using MongoDB.Bson;



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
        //[Authorize(Roles = "Admin")] // Only Admins can create users
        //[Authorize]
        [AllowAnonymous]
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
        //[Authorize(Roles = "Admin")]
        [HttpGet]
        
        public async Task<IActionResult> GetUsers()
        {
            var users = await _mongoDbService.Users.Find(_ => true).ToListAsync();
            return Ok(users);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetUser(string id)
        {
            // Check if id is null, empty, or equals "undefined" (case insensitive)
            if (string.IsNullOrWhiteSpace(id) || id.ToLower() == "undefined")
            {
                return BadRequest("Invalid or missing id parameter");
            }

            if (!ObjectId.TryParse(id, out ObjectId objectId))
            {
                return BadRequest("Invalid id format");
            }

            var filter = Builders<User>.Filter.Eq(u => u.Id, id);
            var user = await _mongoDbService.Users.Find(filter).FirstOrDefaultAsync();

            return user == null ? NotFound() : Ok(user);
        }


        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(string id, [FromBody] User updatedUser)
        {
            if (!ObjectId.TryParse(id, out ObjectId objectId))
                return BadRequest("Invalid user id format.");

            var filter = Builders<User>.Filter.Eq(u => u.Id, id);

            var updateDefBuilder = Builders<User>.Update;
            UpdateDefinition<User> updateDef = null;

            if (!string.IsNullOrEmpty(updatedUser.FullName))
                updateDef = updateDef == null ? updateDefBuilder.Set(u => u.FullName, updatedUser.FullName) : updateDef.Set(u => u.FullName, updatedUser.FullName);

            if (!string.IsNullOrEmpty(updatedUser.Email))
                updateDef = updateDef == null ? updateDefBuilder.Set(u => u.Email, updatedUser.Email) : updateDef.Set(u => u.Email, updatedUser.Email);

            if (!string.IsNullOrEmpty(updatedUser.Role))
                updateDef = updateDef == null ? updateDefBuilder.Set(u => u.Role, updatedUser.Role) : updateDef.Set(u => u.Role, updatedUser.Role);

            // Since IsActive is bool (non-nullable), just update it always (or add a separate check if nullable bool)
            updateDef = updateDef == null ? updateDefBuilder.Set(u => u.IsActive, updatedUser.IsActive) : updateDef.Set(u => u.IsActive, updatedUser.IsActive);

            if (updateDef == null)
                return BadRequest("No valid fields provided to update.");

            var result = await _mongoDbService.Users.UpdateOneAsync(filter, updateDef);

            if (result.MatchedCount == 0)
                return NotFound("User not found.");

            if (result.ModifiedCount > 0)
                return Ok("User updated");

            return Ok("No changes made");
        }








        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            var result = await _mongoDbService.Users.DeleteOneAsync(u => u.Id == id);

            if (result.DeletedCount == 0)
                return NotFound("User not found");

            return Ok("User deleted successfully");
        }


        [HttpGet("filter")]
        //[Authorize(Roles = "Admin")]
        [AllowAnonymous]
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
        [HttpGet("claims")]
        //[Authorize]
        [AllowAnonymous]
        public IActionResult GetClaims()
        {
            return Ok(User.Claims.Select(c => new { c.Type, c.Value }));
        }

    }
}
