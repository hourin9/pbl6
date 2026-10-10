using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PBL6.Models;

namespace PBL6.Controllers.Api;

[Route("api/[controller]")]
[ApiController]
public class UserController : ControllerBase {
    public UserController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<User>>> Get()
    {
        return await _db.Users.ToListAsync();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<User>> Get(int id)
    {
        var usr = await _db.Users.FindAsync(id);
        if (usr == null)
            return NotFound();
        return Ok(usr);
    }

    [HttpPost("post")]
    public async Task<IActionResult> Login([FromBody] Dto.Login m)
    {
        var usr = await _db.Users.FirstOrDefaultAsync(u => u.Name == m.Name);
        if (usr == null)
            return Unauthorized("Invalid username or password");

        if (m.Password == usr.PasswordHash)
            return Unauthorized("Invalid username or password");

        return Ok();
    }

    private readonly AppDbContext _db;
}

