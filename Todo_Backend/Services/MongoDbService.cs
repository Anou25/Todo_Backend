using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Driver;
using Todo_Backend.Models;
using Todo_Backend.Configurations;
using TaskModel = Todo_Backend.Models.TaskModel;

namespace Todo_Backend.Services
{
    public class MongoDbService
    {
        private readonly IMongoCollection<User> _users;
        private readonly IMongoCollection<Project> _projects;
        private readonly IMongoCollection<TaskModel> _tasks;

        public MongoDbService(IOptions<MongoDBSettings> mongoDBSettings)
        {
            Console.WriteLine("Starting MongoDB service initialization...");

            var mongoClient = new MongoClient(mongoDBSettings.Value.ConnectionURI);
            var mongoDatabase = mongoClient.GetDatabase(mongoDBSettings.Value.DatabaseName);

            // Connection Test
            try
            {
                Console.WriteLine("Sending ping to MongoDB...");
                var ping = mongoDatabase.RunCommand<BsonDocument>("{ping:1}");
                Console.WriteLine("MongoDB Atlas connection successful.");
            }
            catch (Exception ex)
            {
                Console.WriteLine("MongoDB Atlas connection failed: " + ex.Message);
                throw;
            }

            _users = mongoDatabase.GetCollection<User>(mongoDBSettings.Value.UserCollection);
            _projects = mongoDatabase.GetCollection<Project>(mongoDBSettings.Value.ProjectCollection);
            _tasks = mongoDatabase.GetCollection<TaskModel>(mongoDBSettings.Value.TaskCollection);
        }

        public IMongoCollection<User> Users => _users;
        public IMongoCollection<Project> Projects => _projects;
        public IMongoCollection<TaskModel> Tasks => _tasks;
    }
}
