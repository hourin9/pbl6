using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PBL6.Models;
using PBL6.Dtos;

namespace PBL6.Controllers.Api;

using CaseListResult = Task<ActionResult<ICollection<CaseDto>>>;

[Authorize]
[Route("api/[controller]")]
[ApiController]
public class QueueController : ControllerBase {
    public QueueController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<ICollection<CaseDto>>> GetPending()
        => Ok(await FilterStatus(StatusIds.Pending));

    [HttpGet]
    public async Task<ActionResult<ICollection<CaseDto>>> GetProcDone()
        => Ok(await FilterStatus(StatusIds.Done));

    [HttpGet]
    public async Task<ActionResult<ICollection<CaseDto>>> GetDenied()
        => Ok(await FilterStatus(StatusIds.Denied));

    [HttpGet]
    public async Task<ActionResult<ICollection<CaseDto>>> GetConfirmed()
        => Ok(await FilterStatus(StatusIds.Confirmed));

    private async CaseListResult FilterStatus(StTup id)
        => await _db.Cases
            .Where(c => c.ReviewStatus.Id == id.Id)
            .Select(c => new CaseDto(c))
            .ToListAsync();

    private readonly AppDbContext _db;
}

