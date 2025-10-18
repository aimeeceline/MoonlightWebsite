using CartService.Model;
using Microsoft.EntityFrameworkCore;

namespace CartService.Repository
{
    public class CartItemRepository : GenericRepository<CartItem>
    {
        public CartItemRepository(CartDBContext context) : base(context) { }

        public CartItem? GetByCartIdAndProductId(int cartId, int productId)
        {
            return _context.CartItems
                .AsNoTracking()
                .FirstOrDefault(ci => ci.CartId == cartId && ci.ProductId == productId);
        }

        public Task<CartItem?> GetByCartIdAndProductIdAsync(int cartId, int productId)
        {
            return _context.CartItems
                .AsNoTracking()
                .FirstOrDefaultAsync(ci => ci.CartId == cartId && ci.ProductId == productId);
        }

        public List<CartItem> GetByCartId(int cartId)
        {
            return _context.CartItems.AsNoTracking()
                .Where(c => c.CartId == cartId).ToList();
        }

        public Task<List<CartItem>> GetByCartIdAsync(int cartId)
        {
            return _context.CartItems.AsNoTracking()
                .Where(c => c.CartId == cartId).ToListAsync();
        }

        public override CartItem? GetById(int cartItemId)
        {
            return _context.CartItems
                .AsNoTracking()
                .Include(ci => ci.Cart)
                .FirstOrDefault(ci => ci.CartItemId == cartItemId);
        }
    }
}
