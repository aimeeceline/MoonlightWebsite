using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductService.Model;
using ProductService.Repository;
using System.Transactions;

namespace ProductService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductController : ControllerBase
    {
        private readonly ProductDBContext _context;
        private readonly IProductRepository<Product> _productRepo; // đổi sang interface

        public ProductController(ProductDBContext context, IProductRepository<Product> productRepo) // đổi tham số
        {
            _context = context;
            _productRepo = productRepo;
        }

        // GET /api/Product  -> { products: [...] }
        [HttpGet]
        public IActionResult Get()
        {
            var products = _context.Products
                .Include(p => p.Category)
                .Select(p => new
                {
                    p.ProductId,
                    p.Name,
                    p.CategoryId,
                    CategoryName = p.Category != null ? p.Category.Name : null,
                    p.Description,
                    p.DescriptionDetails,
                    p.Image,
                    p.Image1,
                    p.Image2,
                    p.Image3,
                    p.Price,
                    p.Inventory,
                    p.ViewCount,
                    p.CreateDate,
                    p.Status
                })
                .ToList();

            return Ok(new { products });
        }

        // GET /api/Product/{id} -> { product: {...} }
        [HttpGet("{id}")]
        public IActionResult Get(int id)
        {
            var product = _context.Products
                .Include(p => p.Category)
                .Where(p => p.ProductId == id)
                .Select(p => new
                {
                    p.ProductId,
                    p.Name,
                    p.CategoryId,
                    CategoryName = p.Category != null ? p.Category.Name : null,
                    p.Description,
                    p.DescriptionDetails,
                    p.Image,
                    p.Image1,
                    p.Image2,
                    p.Image3,
                    p.Price,
                    p.Inventory,
                    p.ViewCount,
                    p.CreateDate,
                    p.Status
                })
                .FirstOrDefault();

            if (product == null) return NotFound();
            return Ok(new { product });
        }

        // POST /api/Product
        [HttpPost]
        public IActionResult Post([FromBody] Product product)
        {
            using var scope = new TransactionScope();
            _productRepo.Insert(product);
            scope.Complete();
            return CreatedAtAction(nameof(Get), new { id = product.ProductId }, new { product });
        }

        // PUT /api/Product/{id}
        [HttpPut("{id}")]
        public IActionResult Put(int id, [FromBody] Product product)
        {
            if (id != product.ProductId) return BadRequest("ID không hợp lệ");

            using var scope = new TransactionScope();
            _productRepo.Update(product);
            scope.Complete();
            return Ok("Cập nhật thành công");
        }

        [HttpPut("toggle-active/{id}")]
        public async Task<IActionResult> ToggleActive(long id, [FromQuery] bool active)
        {
            var p = await _context.Products.FirstOrDefaultAsync(x => x.ProductId == id);
            if (p == null) return NotFound();
            p.Status = active;   // hoặc p.Status = active;
            await _context.SaveChangesAsync();
            return Ok(new { id, isActive = active });
        }

        // GET /api/Product/san-pham-noi-bat -> { products: [...] }
        [HttpGet("san-pham-noi-bat")]
        public IActionResult GetProductNoiBat()
        {
            var products = _context.Products
                .Where(p => p.ViewCount > 100)
                .ToList();

            return Ok(new { products });
        }

    }
}
