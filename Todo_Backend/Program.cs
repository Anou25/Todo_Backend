using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Todo_Backend.Services;
using Todo_Backend.Configurations;
using System.Security.Claims;
using Todo_Backend.Middleware;

var builder = WebApplication.CreateBuilder(args);

// Configuring MongoDB Settings
builder.Services.Configure<MongoDBSettings>(builder.Configuration.GetSection("MongoDBSettings"));
builder.Services.AddSingleton<MongoDbService>();

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
        RoleClaimType = ClaimTypes.Role
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

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseMiddleware<JwtMiddleware>();
app.UseAuthorization();

app.MapControllers();

app.Run();
