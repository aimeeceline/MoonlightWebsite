using Microsoft.EntityFrameworkCore;
using ProductService.Model;

namespace ProductService.Repository
{
    public class ProductRepository : GenericRepository<Product>
    {
        public ProductRepository(ProductDBContext context) : base(context) { }
    }
}
