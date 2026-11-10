using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PBL6.Models;
using PBL6.Dtos;

namespace PBL6.Controllers.Api;

using CaseListResult = Task<ActionResult<ICollection<CaseDto>>>;

[Authorize]
[Route("api/[controller]/[action]")]
[ApiController]
public class QueueController : ControllerBase {
    public QueueController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<ICollection<CaseDto>>> Pending()
        => Ok(await FilterStatus(StatusIds.Pending));

    [HttpGet]
    public async Task<ActionResult<ICollection<CaseDto>>> ProcDone()
        => Ok(await FilterStatus(StatusIds.Done));

    [HttpGet]
    public async Task<ActionResult<ICollection<CaseDto>>> Denied()
        => Ok(await FilterStatus(StatusIds.Denied));

    [HttpGet]
    public async Task<ActionResult<ICollection<CaseDto>>> Confirmed()
        => Ok(await FilterStatus(StatusIds.Confirmed));

    private async CaseListResult FilterStatus(StTup id)
        => await _db.Cases
            .Where(c => c.ReviewStatus.Id == id.Id)
            .Select(c => new CaseDto(c))
            .ToListAsync();

    private readonly AppDbContext _db;
}

