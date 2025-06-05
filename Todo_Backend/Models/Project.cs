using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
namespace Todo_Backend.Models
{
    public class Project
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;

        public string ProjectTitle { get; set; } = string.Empty;

        public string ProjectDescription { get; set; } = string.Empty;

        public string ProjectStatus { get; set; } = "Pending";

        public DateTime StartDate { get; set; }

        public DateTime EndDate { get; set; }

        public bool IsDelete { get; set; } = false;

        [BsonRepresentation(BsonType.ObjectId)]
        public List<string> AssignedUsers { get; set; } = new();
        //[BsonIgnore] // This ensures it won’t be saved to MongoDB
        //public List<User> AssignedUsersDetails { get; set; }


        public string CreatedBy { get; set; } = string.Empty;
    }
}
