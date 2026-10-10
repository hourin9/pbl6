using Microsoft.AspNetCore.Mvc;

namespace PBL6.Controllers.Api;

[Route("api/[controller]")]
[ApiController]
public class HelloController : ControllerBase {
    [HttpGet]
    public IActionResult Get()
    {
        return Ok("Hello World");
    }
}

