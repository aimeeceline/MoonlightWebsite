using DiscountService.Model;
using Microsoft.EntityFrameworkCore;

namespace DiscountService.Repository
{
    public class DiscountRepository: GenericRepository<Discount>
    {
        private readonly DiscountDBContext _context;

        public DiscountRepository()
        {
            _context = new DiscountDBContext();
        }
        public Discount? GetByCode(string code)
        {
            return _context.Discounts.FirstOrDefault(d => d.Code == code);
        }
    }
}
