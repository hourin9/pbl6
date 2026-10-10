using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PBL6.Models;

namespace PBL6.Controllers.Api;

[Route("api/[controller]")]
[ApiController]
public class PatientController : ControllerBase {
    public PatientController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Patient>>> Get()
    {
        return await _db.Patients.ToListAsync();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Patient>> Get(int id)
    {
        var pat = await _db.Patients.FindAsync(id);
        if (pat == null)
            return NotFound();
        return Ok(pat);
    }

    private readonly AppDbContext _db;
}

