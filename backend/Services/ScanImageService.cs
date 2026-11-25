using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PBL6.Models;
using PBL6.Dtos;
using PBL6.Services;

namespace PBL6.Services;

public class ScanImageService {
    public ScanImageService(IWebHostEnvironment env, AppDbContext db)
    {
        _env = env;
        _db = db;
    }

    public async Task<Stream?> Get(int id)
    {
        ScanImage? img = await _db.ScanImages.FindAsync(id);
        if (img == null)
            return null;

        var path = Path.IsPathRooted(img.FilePath)
            ? img.FilePath
            : Path.Combine(_env.WebRootPath ?? _env.ContentRootPath, img.FilePath);

        if (!System.IO.File.Exists(path))
            return null;

        var content = new FileStream(path, FileMode.Open, FileAccess.Read);
        return content;
    }

    [HttpPost("upload")]
    public async Task<ScanImage> Upload(IFormFile f, int cas, int uploader)
    {
        if (f == null || f.Length == 0)
            throw new ArgumentNullException();

        var uploadsDir = Path.Combine(_env.WebRootPath, "uploads");
        if (!Directory.Exists(uploadsDir))
            Directory.CreateDirectory(uploadsDir);

        var name = $"{Guid.NewGuid()}.dcm";
        var path = Path.Combine(uploadsDir, name);

        using (var stream = new FileStream(path, FileMode.Create)) {
            await f.CopyToAsync(stream);
        }

        var image = new ScanImage {
            FilePath = path,
            CaseId = cas,
            UploaderId = uploader,
        };

        _db.ScanImages.Add(image);
        await _db.SaveChangesAsync();

        return image;
    }

    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;
}

