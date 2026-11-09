using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PBL6.Models;
using PBL6.Dtos;

namespace PBL6.Controllers.Api;

[Authorize]
[Route("api/[controller]")]
[ApiController]
public class ImageController : ControllerBase {
    public ImageController(AppDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        ScanImage? img = await _db.ScanImages.FindAsync(id);
        if (img == null)
            return NotFound();

        var path = img.FilePath;

        if (!System.IO.File.Exists(path))
            return NotFound();

        var content = new FileStream(path, FileMode.Open, FileAccess.Read);

        return Ok(File(content, "application/octet-stream"));
    }

    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;
}

