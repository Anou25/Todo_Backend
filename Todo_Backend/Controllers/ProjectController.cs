using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;
using Todo_Backend.Models;
using Todo_Backend.Services;

namespace Todo_Backend.Controllers
{
    [ApiController]
    [Route("api/project")]
    //[Authorize]
    //[AllowAnonymous]
    public class ProjectController : ControllerBase
    {
        private readonly MongoDbService _mongoDbService;

        public ProjectController(MongoDbService mongoDbService)
        {
            _mongoDbService = mongoDbService;
        }

        // Admin only: Create project
        [HttpPost("create")]
        //[Authorize(Roles = "Admin")]
        [AllowAnonymous]
        //[Authorize]
        public async Task<IActionResult> CreateProject([FromBody] Project project)
        {
            // Try to get user ID from token (if available)
            var userId = User?.FindFirstValue(ClaimTypes.NameIdentifier);

            // If token not present, fallback to a default or anonymous user ID
            if (string.IsNullOrEmpty(userId))
            {
                userId = "anonymous"; // or a default ID like "dev-admin-id"
            }

            // Validate assigned users
            if (project.AssignedUsers == null || !project.AssignedUsers.Any() ||
                project.AssignedUsers.Any(u => string.IsNullOrWhiteSpace(u)))
            {
                return BadRequest("AssignedUsers must contain valid user IDs.");
            }

            project.CreatedBy = userId;
            project.StartDate = project.StartDate.Date;
            project.EndDate = project.EndDate.Date;

            await _mongoDbService.Projects.InsertOneAsync(project);

            return Ok("Project created successfully");
        }

        // Admin only: Get all projects without pagination
        [HttpGet]
        //[Authorize(Roles = "Admin")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAllProjects()
        {
            var projects = await _mongoDbService.Projects.Find(_ => true).ToListAsync();
            return Ok(projects);
        }

        // Get project by ID
        [HttpGet("{id}")]
        public async Task<IActionResult> GetProject(string id)
        {
            if (!ObjectId.TryParse(id, out ObjectId objectId))
            {
                return BadRequest("Invalid project ID.");
            }

            var project = await _mongoDbService.Projects.Find(p => p.Id == objectId.ToString()).FirstOrDefaultAsync();

            return project == null ? NotFound() : Ok(project);
        }

        // Admin only: Update a project
        [HttpPut("{id}")]
        //[Authorize(Roles = "Admin")]
        [AllowAnonymous]
        public async Task<IActionResult> UpdateProject(string id, [FromBody] Project updated)
        {
            //Validate incoming ID
            if (string.IsNullOrEmpty(id) || !ObjectId.TryParse(id, out _))
            {
                return BadRequest("Invalid project ID");
            }

            //Set the correct ID on the updated project object
            updated.Id = id;

            var result = await _mongoDbService.Projects.ReplaceOneAsync(p => p.Id == id, updated);

            return result.ModifiedCount > 0 ? Ok("Project updated") : NotFound();
        }


        // Admin only: Delete a project
        [HttpDelete("{id}")]
        //[Authorize(Roles = "Admin")]
        [AllowAnonymous]
        public async Task<IActionResult> DeleteProject(string id)
        {
            if (string.IsNullOrEmpty(id) || id == "undefined")
            {
                return BadRequest("Invalid project ID");
            }

            try
            {
                var result = await _mongoDbService.Projects.DeleteOneAsync(p => p.Id == id);
                return result.DeletedCount > 0 ? Ok("Project deleted") : NotFound();
            }
            catch (FormatException ex)
            {
                return BadRequest(new { message = "Invalid project ID format", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting project", error = ex.Message });
            }
        }

            // Get all projects assigned to a specific user
            [HttpGet("user/{userId}")]
            public async Task<IActionResult> GetProjectsByUserId(string userId)
        {
            try
            {
                var filter = Builders<Project>.Filter.AnyEq(p => p.AssignedUsers, userId);
                var projects = await _mongoDbService.Projects.Find(filter).ToListAsync();
                return Ok(projects);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching projects", error = ex.Message });
            }
        }

        // Paginated, searchable, filterable project list
        [HttpGet("filter")]
        //[Authorize(Roles = "Admin")]
        [AllowAnonymous]
        public async Task<IActionResult> GetProjectsWithFilters(
    [FromQuery] string? status = null,
    [FromQuery] DateTime? startDate = null,
    [FromQuery] DateTime? endDate = null,
    [FromQuery] string? search = null,
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 10)
        {
            try
            {
                var filterBuilder = Builders<Project>.Filter;
                var filter = filterBuilder.Empty;

                // Filter by status
                if (!string.IsNullOrEmpty(status))
                {
                    filter &= filterBuilder.Eq(p => p.ProjectStatus, status);
                }

                // Filter by created date or deadline
                if (startDate.HasValue)
                {
                    filter &= filterBuilder.Gte(p => p.StartDate, startDate.Value.Date);
                }
                if (endDate.HasValue)
                {
                    filter &= filterBuilder.Lte(p => p.EndDate, endDate.Value.Date.AddDays(1).AddTicks(-1));
                }

                // Search by project name (case-insensitive)
                if (!string.IsNullOrEmpty(search))
                {
                    var regex = new MongoDB.Bson.BsonRegularExpression(search, "i");
                    filter &= filterBuilder.Regex(p => p.ProjectTitle, regex);
                }

                var totalCount = await _mongoDbService.Projects.CountDocumentsAsync(filter);

                var projects = await _mongoDbService.Projects
                    .Find(filter)
                    .Skip((page - 1) * pageSize)
                    .Limit(pageSize)
                    .ToListAsync();

                return Ok(new
                {
                    totalCount,
                    currentPage = page,
                    totalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                    data = projects
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching projects", error = ex.Message });
            }
        }

    }
}
