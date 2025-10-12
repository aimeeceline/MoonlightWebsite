using CartService.Model;
using Microsoft.EntityFrameworkCore;

namespace CartService.Repository
{
    public class CartRepository : GenericRepository<Cart>
    {
        public CartRepository(CartDBContext context) : base(context) { }

        public Cart? GetByUserId(int userId)
        {
            return _context.Carts
                           .AsNoTracking()
                           .FirstOrDefault(c => c.UserId == userId);
        }
    }
}
