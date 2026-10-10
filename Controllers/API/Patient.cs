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
    public async Task<ActionResult<IEnumerable<Patient>>> GetPatient()
    {
        return await _db.Patients.ToListAsync();
    }

    private readonly AppDbContext _db;
}

