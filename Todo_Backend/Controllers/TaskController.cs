using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using Todo_Backend.Models;
using Todo_Backend.Services;
using System.Security.Claims;

namespace Todo_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class TaskController : ControllerBase
    {
        private readonly MongoDbService _mongoDbService;

        public TaskController(MongoDbService mongoDbService)
        {
            _mongoDbService = mongoDbService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateTask([FromBody] TaskModel task)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            task.CreatedBy = userId;
            await _mongoDbService.Tasks.InsertOneAsync(task);
            return Ok("Task created");
        }

        [HttpGet("project/{projectId}")]
        public async Task<IActionResult> GetTasksByProject(string projectId)
        {
            var tasks = await _mongoDbService.Tasks.Find(t => t.ProjectId == projectId).ToListAsync();
            return Ok(tasks);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTask(string id, [FromBody] TaskModel task)
        {
            var result = await _mongoDbService.Tasks.ReplaceOneAsync(t => t.Id == id, task);
            return result.ModifiedCount > 0 ? Ok("Task updated") : NotFound();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTask(string id)
        {
            var result = await _mongoDbService.Tasks.DeleteOneAsync(t => t.Id == id);
            return result.DeletedCount > 0 ? Ok("Task deleted") : NotFound();
        }

        [HttpGet("project/{projectId}/user/{userId}")]
        public async Task<IActionResult> GetTasksByProjectId(string projectId, string userId)
        {
            try
            {
                Console.WriteLine($"Fetching tasks for Project ID: {projectId}");
                Console.WriteLine($"Fetching tasks for User ID: {userId}");

                var filter = Builders<TaskModel>.Filter.And(
                    Builders<TaskModel>.Filter.Eq(t => t.ProjectId, projectId),
                    Builders<TaskModel>.Filter.AnyEq(t => t.AssignedUsers, userId),
                    Builders<TaskModel>.Filter.Eq(t => t.IsDelete, false)
                );

                var tasks = await _mongoDbService.Tasks.Find(filter).ToListAsync();

                if (!tasks.Any())
                {
                    Console.WriteLine("No tasks found for the provided projectId and userId.");
                    return Ok(new List<TaskModel>());
                }

                return Ok(tasks);
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error fetching tasks by project ID and user ID: " + ex.Message);
                return StatusCode(500, new { message = "Server error", error = ex.Message });
            }
        }

        [HttpGet("filter")]
        public async Task<IActionResult> GetFilteredTasks(
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 10,
    [FromQuery] string? search = null,
    [FromQuery] string? status = null,
    [FromQuery] DateTime? startDate = null,
    [FromQuery] DateTime? endDate = null,
    [FromQuery] string? assignedUserId = null)
        {
            try
            {
                var filterBuilder = Builders<TaskModel>.Filter;
                var filter = filterBuilder.Eq(t => t.IsDelete, false); // Skip deleted

                if (!string.IsNullOrEmpty(search))
                {
                    filter &= filterBuilder.Regex(t => t.TaskTitle, new MongoDB.Bson.BsonRegularExpression(search, "i"));
                }

                if (!string.IsNullOrEmpty(status))
                {
                    filter &= filterBuilder.Eq(t => t.TaskStatus, status);
                }

                if (startDate.HasValue)
                {
                    filter &= filterBuilder.Gte(t => t.StartDate, startDate.Value);
                }

                if (endDate.HasValue)
                {
                    filter &= filterBuilder.Lte(t => t.EndDate, endDate.Value);
                }

                if (!string.IsNullOrEmpty(assignedUserId))
                {
                    filter &= filterBuilder.AnyEq(t => t.AssignedUsers, assignedUserId);
                }

                var totalCount = await _mongoDbService.Tasks.CountDocumentsAsync(filter);
                var tasks = await _mongoDbService.Tasks
                    .Find(filter)
                    .Skip((page - 1) * pageSize)
                    .Limit(pageSize)
                    .ToListAsync();

                return Ok(new
                {
                    totalCount,
                    currentPage = page,
                    totalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                    data = tasks
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching filtered tasks", error = ex.Message });
            }
        }

    }
}
