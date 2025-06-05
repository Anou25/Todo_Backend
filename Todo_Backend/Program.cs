using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Todo_Backend.Services;
using Todo_Backend.Configurations;
using System.Security.Claims;
using Todo_Backend.Middleware;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);



// Configuring MongoDB Settings
builder.Services.Configure<MongoDBSettings>(builder.Configuration.GetSection("MongoDBSettings"));
builder.Services.AddSingleton<MongoDbService>();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        builder =>
        {
            builder.WithOrigins("http://localhost:5173")
                   .AllowAnyHeader()
                   .AllowAnyMethod();
                   //.AllowCredentials();
        });
});

// Configuring JwtSettings
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));

// Registering JwtService for token generation
builder.Services.AddScoped<JwtService>();

// Adding JWT Authentication configuration
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    var jwtSettings = builder.Configuration.GetSection("Jwt").Get<JwtSettings>();

    if (jwtSettings == null || string.IsNullOrWhiteSpace(jwtSettings.Key))
    {
        throw new ArgumentNullException(nameof(jwtSettings.Key), "JWT secret key cannot be null or empty.");
    }

    if (string.IsNullOrWhiteSpace(jwtSettings.Issuer))
    {
        throw new ArgumentNullException(nameof(jwtSettings.Issuer), "JWT issuer cannot be null or empty.");
    }

    if (string.IsNullOrWhiteSpace(jwtSettings.Audience))
    {
        throw new ArgumentNullException(nameof(jwtSettings.Audience), "JWT audience cannot be null or empty.");
    }

    var key = Encoding.UTF8.GetBytes(jwtSettings.Key);
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidAudience = jwtSettings.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(key),

        // [Authorize(Roles = "Admin")]
        //RoleClaimType = "role"
        RoleClaimType = ClaimTypes.Role,
        ClockSkew = TimeSpan.FromMinutes(5) // ADD THIS
    };
    // Log authentication failures
    options.Events = new JwtBearerEvents
    {
        OnAuthenticationFailed = context =>
        {
            Console.WriteLine($"❌ Token authentication failed: {context.Exception.Message}");
            return Task.CompletedTask;
        },
        OnMessageReceived = context =>
        {
            Console.WriteLine($"📩 Received token: {context.Token ?? "null"}");
            return Task.CompletedTask;
        }
    };


});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");
//app.UseHttpsRedirection();

app.UseAuthentication();
//app.UseMiddleware<JwtMiddleware>();
app.UseAuthorization();

app.MapControllers();

app.Run();
