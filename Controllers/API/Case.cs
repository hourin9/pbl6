using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PBL6.Models;
using PBL6.Dtos;
using PBL6.Services;

namespace PBL6.Controllers.Api;

[Authorize]
[Route("api/[controller]")]
[ApiController]
public class CaseController : ControllerBase {
    public CaseController(AppDbContext db, ScanImageService serv)
    {
        _imgServ = serv;
        _db = db;
    }

    // TODO: include all information with Case by default or split into
    // different APIs?

    [HttpGet("{id:int}")]
    public async Task<ActionResult<CaseDto>> Get(int id)
    {
        var cas = await _db.Cases
            .Include(c => c.Patient)
            .Include(c => c.ReviewStatus)
            .FirstOrDefaultAsync(c => c.Id == id);
        if (cas == null)
            return NotFound();
        return Ok(new CaseDto(cas));
    }

    [HttpPost("{id:int}/approve")]
    public async Task<IActionResult> Approve(int id, [FromBody] string note)
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

    [HttpPost("create")]
    public async Task<IActionResult> Create([FromBody] CaseCreateDto req)
    {
        using var transaction = await _db.Database.BeginTransactionAsync();

        try {
            var newCase = new Case {
                CreatedAt = DateTime.UtcNow,
                Note = req.Note,
                PatientId = req.PatientId,
                ReviewerId = req.ReviewerId,
                StatusId = StatusIds.Pending.Id,
            };

            _db.Cases.Add(newCase);
            await _db.SaveChangesAsync();

            if (req.Images != null && req.Images.Count > 0) {
                foreach (var file in req.Images)
                    await _imgServ.Upload(file, newCase.Id, req.UploaderId);

                await _db.SaveChangesAsync();
            }

            await transaction.CommitAsync();
            return Ok(newCase);
        }
        catch {
            await transaction.RollbackAsync();
            return StatusCode(500);
        }
    }

    private readonly AppDbContext _db;
    private readonly ScanImageService _imgServ;
}

