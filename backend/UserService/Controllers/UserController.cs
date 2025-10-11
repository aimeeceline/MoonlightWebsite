using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UserService.Model;

[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly UserDBContext _db;
    public UserController(UserDBContext db) => _db = db;

    [HttpGet("all")]
public async Task<IActionResult> GetAll()
{
    var users = await _db.Users
        .AsNoTracking()
        .Where(u => u.TypeUser != null && u.TypeUser.ToLower() == "user") // chỉ user
        .ToListAsync();

    return Ok(users);
}

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == id);
        return user is null ? NotFound() : Ok(user);
    }

    [HttpPost("Create")]
    public async Task<IActionResult> Create([FromBody] User user)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        user.UserId = 0;
        if (await _db.Users.AnyAsync(u => u.Username == user.Username))
            return Conflict("Username đã tồn tại.");
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = user.UserId }, user);
    }

    [HttpPut("Edit/{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] User user)
    {
        if (id != user.UserId) return BadRequest("ID không khớp");
        _db.Entry(user).State = EntityState.Modified;
        await _db.SaveChangesAsync();
        return Ok("Cập nhật thành công");
    }

    [HttpDelete("Delete/{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _db.Users.FindAsync(id);
        if (entity is null) return NotFound();
        _db.Users.Remove(entity);
        await _db.SaveChangesAsync();
        return Ok();
    }
}
