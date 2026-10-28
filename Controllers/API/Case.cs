using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PBL6.Models;

namespace PBL6.Controllers.Api;

[Authorize]
[Route("api/[controller]")]
[ApiController]
public class CaseController : ControllerBase {
    public CaseController(AppDbContext db)
    {
        _db = db;
    }

    // TODO: include all information with Case by default or split into
    // different APIs?

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Patient>> Get(int id)
    {
        var cas = await _db.Cases.FindAsync(id);
        if (cas == null)
            return NotFound();
        return Ok(cas);
    }

    private readonly AppDbContext _db;
}

