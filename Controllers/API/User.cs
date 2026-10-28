using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace PBL6.Controllers.Api;

[Authorize]
[Route("api/[controller]")]
[ApiController]
public class UserController : ControllerBase {
    public UserController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Dto.User>>> Get()
    {
        return await _db.Users
            .Include(u => u.Department)
            .Select(u => new Dto.User(u))
            .ToListAsync();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Dto.User>> Get(int id)
    {
        var usr = await _db.Users
            .Include(u => u.Department)
            .FirstOrDefaultAsync(u => u.Id == id);
        if (usr == null)
            return NotFound();
        return Ok(new Dto.User(usr));
    }

    private readonly AppDbContext _db;
}

