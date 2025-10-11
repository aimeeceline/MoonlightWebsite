using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductService.Model;
using Shared.Contracts; 
namespace ProductService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoryController : ControllerBase
    {
        private readonly ProductDBContext _context;
        public CategoryController(ProductDBContext context) => _context = context;

        // GET /api/Category  -> nếu FE đọc categories, bọc lại { categories: [...] }
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var categories = await _context.Categories
                .AsNoTracking()
                .Select(c => new
                {
                    categoryId  = c.CategoryId,
                    name        = c.Name,
                    description = c.Description
                })
                .ToListAsync();

            return Ok(new { categories });
        }

        // GET /api/Category/category/{id} -> FE gốc đọc { products: [...] }
        [HttpGet("category/{id:int}")]
        public async Task<IActionResult> GetProductsByCategory(int id)
        {
            var products = await _context.Products
                .AsNoTracking()
                .Where(p => p.CategoryId == id)
                .Select(p => new
                {
                    p.ProductId,
                    p.Name,
                    p.Price,
                    p.Image,
                    p.Inventory
                })
                .ToListAsync();

            return Ok(new { products });
        }
    }
}
