using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PBL6.Models;
using PBL6.Dtos;

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
    public async Task<ActionResult<Case>> Get(int id)
    {
        var cas = await _db.Cases
            .Include(c => c.Patient)
            .Include(c => c.ReviewStatus)
            .FirstOrDefaultAsync(c => c.Id == id);
        if (cas == null)
            return NotFound();
        return Ok(new CaseDto(cas));
    }

    [HttpPost("{id:int}/accept")]
    public async Task<IActionResult> Accept(int id, [FromBody] string note)
    {
        var cas = await _db.Cases.FindAsync(id);
        if (cas == null)
            return NotFound();

        cas.ReviewStatus = await _db.ReviewStatuses
            .FindAsync(Models.StatusIds.Done);

        cas.Note = note;

        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("{id:int}/deny")]
    public async Task<IActionResult> Deny(int id, [FromBody] string note)
    {
        var cas = await _db.Cases.FindAsync(id);
        if (cas == null)
            return NotFound();

        // Queue stuff here

        return Ok();
    }

    private readonly AppDbContext _db;
}

