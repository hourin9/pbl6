using Microsoft.AspNetCore.Mvc;

public class AccountController : Controller {
    [HttpGet("login")]
    public IActionResult Login()
    {
        return View();
    }
}

