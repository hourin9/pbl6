using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace PBL6.Controllers.Api;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase {
    public AuthController(AppDbContext db)
    {
        _db = db;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] Dto.Login m)
    {
        var usr = await _db.Users.FirstOrDefaultAsync(u => u.Name == m.Name);
        if (usr == null)
            return Unauthorized("Invalid username or password");

        if (m.Password != usr.PasswordHash)
            return Unauthorized("Invalid username or password");

        var claims = new List<Claim> {
            new Claim(ClaimTypes.NameIdentifier, usr.Id.ToString()),
            new Claim(ClaimTypes.Name, usr.Name),
            new Claim(ClaimTypes.Role, usr.IsAdmin ? "admin" : "user"),
        };

        var claimsIdn = new ClaimsIdentity(
            claims,
            CookieAuthenticationDefaults.AuthenticationScheme
        );

        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            new ClaimsPrincipal(claimsIdn)
        );

        return Ok();
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(
            CookieAuthenticationDefaults.AuthenticationScheme
        );
        return Ok();
    }

    private readonly AppDbContext _db;
}

