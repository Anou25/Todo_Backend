using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
namespace Todo_Backend.Models
{
    public class TaskModel
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;

        public string TaskTitle { get; set; } = string.Empty;

        public string TaskDescription { get; set; } = string.Empty;

        public string TaskStatus { get; set; } = "To Do";

        public DateTime StartDate { get; set; }

        public DateTime EndDate { get; set; }

        public bool IsDelete { get; set; } = false;

        [BsonRepresentation(BsonType.ObjectId)]
        public string ProjectId { get; set; } = string.Empty;

        [BsonRepresentation(BsonType.ObjectId)]
        public List<string> AssignedUsers { get; set; } = new();

        public string CreatedBy { get; set; } = string.Empty;
    }
}
