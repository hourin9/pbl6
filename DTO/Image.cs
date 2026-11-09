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
public class ImageController : ControllerBase {
    public ImageController(AppDbContext db, ScanImageService s)
    {
        _db = db;
        _imgServ = s;
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
        return Ok(File(content, "application/dicom"));
    }

    [HttpPost("upload")]
    public async Task<IActionResult> Upload(IFormFile f)
    {
        try {
            // TODO: change the uploader and case ID to proper values.
            var res = await _imgServ.Upload(f, 1, 1);
            return Ok(res);
        } catch (ArgumentNullException e) {
            return BadRequest(e.Message);
        }
    }

    private readonly AppDbContext _db;
    private readonly ScanImageService _imgServ;
}

