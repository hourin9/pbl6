using Microsoft.AspNetCore.Mvc;

[Route("api/[controller]")]
[ApiController]
public class Hello : ControllerBase {
    [HttpGet]
    public IActionResult GetHello()
    {
        return Ok("Hello World");
    }
}

