using Microsoft.AspNetCore.Mvc;

namespace PBL6.Controllers.Api;

[Route("api/[controller]")]
[ApiController]
public class Hello : ControllerBase {
    [HttpGet]
    public IActionResult GetHello()
    {
        return Ok("Hello World");
    }
}

