using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PBL6.Models;
using PBL6.Dtos;
using PBL6.Services;

namespace PBL6.Controllers;

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
        var result = await _imgServ.Get(id);
        if (result == null)
            return NotFound();

        return File(result, "application/dicom");
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

