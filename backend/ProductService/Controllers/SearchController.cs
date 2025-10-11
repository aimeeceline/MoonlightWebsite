using Microsoft.AspNetCore.Mvc;
using ProductService.Model;   // Import DbContext
using System.Linq;
using ProductService.Model;
using Shared.Contracts; 
namespace ProductService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SearchController : ControllerBase
    {
        private readonly ProductDBContext _context;

        public SearchController(ProductDBContext context)
        {
            _context = context;
        }

        [HttpGet]
        public IActionResult Search(string keyword)
        {
            if (string.IsNullOrEmpty(keyword))
            {
                return BadRequest(new { message = "Từ khóa tìm kiếm không được để trống." });
            }

            var results = _context.Products
                .Where(p => p.Name.Contains(keyword)) // có thể thêm ToLower() nếu cần
                .ToList();

            if (results == null || results.Count == 0)
            {
                return NotFound(new { message = "Không tìm thấy sản phẩm nào." });
            }

            return Ok(results);
        }
    }
}
