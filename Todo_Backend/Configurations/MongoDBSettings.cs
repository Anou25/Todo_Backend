namespace Todo_Backend.Configurations
{
    public class MongoDBSettings
    {
        public string ConnectionURI { get; set; } = string.Empty;
        public string DatabaseName { get; set; } = string.Empty;
        public string UserCollection { get; set; } = string.Empty;
        public string ProjectCollection { get; set; } = string.Empty;
        public string TaskCollection { get; set; } = string.Empty;
    }
}
