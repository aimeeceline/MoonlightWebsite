using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductService.Model;
using ProductService.Repository;
using System.Transactions;
using Shared.Contracts; 
namespace ProductService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductController : ControllerBase
    {
        private readonly ProductDBContext _context;
        private readonly ProcductRepository _productRepo; // hoặc ProductRepository nếu đúng tên lớp

        public ProductController(ProductDBContext context, ProcductRepository productRepo)
        {
            _context = context;
            _productRepo = productRepo;
        }

        // GET /api/Product  -> FE gốc kỳ vọng { products: [...] }
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

            // 👇 Quan trọng: bọc lại cho đúng shape FE đọc
            return Ok(new { products });
        }

        // GET /api/Product/{id} -> FE thường đọc { product: {...} }
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

            // 👇 bọc lại
            return Ok(new { product });
        }

        // POST /api/Product
        [HttpPost]
        public IActionResult Post([FromBody] Product product)
        {
            using (var scope = new TransactionScope())
            {
                _productRepo.Insert(product);
                scope.Complete();
                // Trả về shape quen thuộc cũng được, nhưng giữ nguyên CreatedAtAction cho đúng REST
                return CreatedAtAction(nameof(Get), new { id = product.ProductId }, new { product });
            }
        }

        // PUT /api/Product/{id}
        [HttpPut("{id}")]
        public IActionResult Put(int id, [FromBody] Product product)
        {
            if (id != product.ProductId) return BadRequest("ID không hợp lệ");

            using (var scope = new TransactionScope())
            {
                _productRepo.Update(product);
                scope.Complete();
                return Ok("Cập nhật thành công");
            }
        }

        // DELETE /api/Product/{id}
        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            _productRepo.Delete(id);
            return Ok();
        }

        // GET /api/Product/san-pham-noi-bat  -> tuỳ FE có dùng không
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
