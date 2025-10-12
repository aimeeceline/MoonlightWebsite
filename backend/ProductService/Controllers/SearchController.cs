using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductService.Model;

namespace ProductService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SearchController : ControllerBase
    {
        private readonly ProductDBContext _context;
        public SearchController(ProductDBContext context) => _context = context;

        // GET /api/Search?keyword=...
        [HttpGet]
        public async Task<IActionResult> Search(string keyword)
        {
            if (string.IsNullOrWhiteSpace(keyword))
                return Ok(new { products = Array.Empty<object>() }); // vẫn trả 200 cho FE

            var products = await _context.Products
                .AsNoTracking()
                .Where(p => EF.Functions.Like(p.Name, $"%{keyword.Trim()}%"))
                .Select(p => new { p.ProductId, p.Name, p.Price, p.Image, p.Inventory })
                .ToListAsync();

            // Không NotFound để FE đỡ phải handle 404
            return Ok(new { products });
        }
    }
}
