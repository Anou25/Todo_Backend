using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using Todo_Backend.Models;
using Todo_Backend.Services;
using System.Security.Claims;
using MongoDB.Bson;
using Todo_Backend.DTOs;

namespace Todo_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    //[Authorize(Roles = "Admin")]
    [AllowAnonymous]
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
            if (!ObjectId.TryParse(id, out var objectId))
            {
                return BadRequest("Invalid task ID format");
            }

            if (string.IsNullOrEmpty(task.ProjectId) || !ObjectId.TryParse(task.ProjectId, out _))
            {
                return BadRequest("Invalid ProjectId format");
            }

            // Use correct ObjectId filter for _id
            var filter = Builders<TaskModel>.Filter.Eq("_id", objectId);
            var existingTask = await _mongoDbService.Tasks.Find(filter).FirstOrDefaultAsync();
            if (existingTask == null)
            {
                return NotFound("Task not found");
            }

            Console.WriteLine("AssignedUsers received: " + string.Join(", ", task.AssignedUsers ?? new List<string>()));

            var updateDefBuilder = Builders<TaskModel>.Update;
            var updateDefs = new List<UpdateDefinition<TaskModel>>();

            // Only add updates for fields that are not null or default
            if (!string.IsNullOrEmpty(task.TaskTitle) && task.TaskTitle != existingTask.TaskTitle)
                updateDefs.Add(updateDefBuilder.Set(t => t.TaskTitle, task.TaskTitle));

            if (!string.IsNullOrEmpty(task.TaskDescription) && task.TaskDescription != existingTask.TaskDescription)
                updateDefs.Add(updateDefBuilder.Set(t => t.TaskDescription, task.TaskDescription));

            if (!string.IsNullOrEmpty(task.TaskStatus) && task.TaskStatus != existingTask.TaskStatus)
                updateDefs.Add(updateDefBuilder.Set(t => t.TaskStatus, task.TaskStatus));

            if (task.StartDate != default && task.StartDate != existingTask.StartDate)
                updateDefs.Add(updateDefBuilder.Set(t => t.StartDate, task.StartDate));

            if (task.EndDate != default && task.EndDate != existingTask.EndDate)
                updateDefs.Add(updateDefBuilder.Set(t => t.EndDate, task.EndDate));

            //if (task.AssignedUsers != null && !task.AssignedUsers.SequenceEqual(existingTask.AssignedUsers))
            //    updateDefs.Add(updateDefBuilder.Set(t => t.AssignedUsers, task.AssignedUsers));
            if (task.AssignedUsers != null && !new HashSet<string>(task.AssignedUsers).SetEquals(existingTask.AssignedUsers))
                updateDefs.Add(updateDefBuilder.Set(t => t.AssignedUsers, task.AssignedUsers));


            if (!string.IsNullOrEmpty(task.ProjectId) && task.ProjectId != existingTask.ProjectId)
                updateDefs.Add(updateDefBuilder.Set(t => t.ProjectId, task.ProjectId));

            if (!string.IsNullOrEmpty(task.CreatedBy) && task.CreatedBy != existingTask.CreatedBy)
                updateDefs.Add(updateDefBuilder.Set(t => t.CreatedBy, task.CreatedBy));

            if (task.IsDelete != existingTask.IsDelete)
                updateDefs.Add(updateDefBuilder.Set(t => t.IsDelete, task.IsDelete));

            if (updateDefs.Count == 0)
            {
                return NotFound("No changes made");
            }

            var combinedUpdate = updateDefBuilder.Combine(updateDefs);

            var result = await _mongoDbService.Tasks.UpdateOneAsync(filter, combinedUpdate);

            return result.ModifiedCount > 0 ? Ok("Task updated") : NotFound("No changes made");
        }






        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTask(string id)
        {
            if (!ObjectId.TryParse(id, out var objectId))
            {
                return BadRequest("Invalid task ID format.");
            }

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
    [FromQuery] string? assignedUserId = null,
    [FromQuery] string? projectId = null)
        {
            try
            {
                var filterBuilder = Builders<TaskModel>.Filter;
                var filter = filterBuilder.Eq(t => t.IsDelete, false);

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

                if (!string.IsNullOrEmpty(projectId))
                {
                    filter &= filterBuilder.Eq(t => t.ProjectId, projectId);
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
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateTaskStatus(string id, [FromBody] TaskStatusUpdateDto statusUpdate)
        {
            if (!ObjectId.TryParse(id, out var objectId))
                return BadRequest("Invalid task ID format.");

            if (statusUpdate == null || string.IsNullOrWhiteSpace(statusUpdate.TaskStatus))
                return BadRequest("TaskStatus is required.");

            var filter = Builders<TaskModel>.Filter.Eq("_id", objectId);
            var update = Builders<TaskModel>.Update.Set(t => t.TaskStatus, statusUpdate.TaskStatus);

            var result = await _mongoDbService.Tasks.UpdateOneAsync(filter, update);

            if (result.MatchedCount == 0)
                return NotFound("Task not found.");

            return Ok("Task status updated.");
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetTaskById(string id)
        {
            if (!ObjectId.TryParse(id, out var objectId))
            {
                return BadRequest("Invalid task ID format");
            }

            var filter = Builders<TaskModel>.Filter.Eq("_id", objectId);
            var task = await _mongoDbService.Tasks.Find(filter).FirstOrDefaultAsync();

            if (task == null)
                return NotFound("Task not found");

            return Ok(task);
        }
    

    }
}
