using CartService.Model;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json.Linq;

namespace CartService.Repository
{
    public class CartRepository : GenericRepository<Cart>
    {
        private readonly ApiClientHelper _api;

        public CartRepository(CartDBContext context, ApiClientHelper api) : base(context)
        {
            _api = api;
        }

        // ===== Logic domain =====

        // Lấy hoặc tạo giỏ hàng cho user
        public async Task<Cart> GetOrCreateCartAsync(int userId)
        {
            var cart = await _context.Carts
                .Include(c => c.CartItems)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart is null)
            {
                cart = new Cart
                {
                    UserId = userId,
                    CreateDate = DateTime.UtcNow,
                    TotalCartPrice = 0,
                    OriginalTotal = 0,
                    Discount = 0
                };
                _context.Carts.Add(cart);
                await _context.SaveChangesAsync();
            }
            return cart;
        }

        // Lấy items của giỏ
        public Task<List<CartItem>> GetItemsAsync(int cartId)
        {
            return _context.CartItems
                .AsNoTracking()
                .Where(x => x.CartId == cartId)
                .OrderBy(x => x.CartItemId)
                .ToListAsync();
        }

        // Add hoặc cập nhật sản phẩm
        public async Task<Cart> AddOrUpdateItemAsync(int userId, int productId, int quantity)
        {
            var cart = await GetOrCreateCartAsync(userId);

            var item = await _context.CartItems
                .FirstOrDefaultAsync(i => i.CartId == cart.CartId && i.ProductId == productId);

            // Lấy thông tin product từ ProductService
            var product = await _api.GetProductByIdAsync(productId);
            if (product is null)
                throw new InvalidOperationException($"Không tìm thấy sản phẩm {productId}.");

            var price = product.Price ?? 0m;

            if (item is null)
            {
                item = new CartItem
                {
                    CartId = cart.CartId,
                    ProductId = productId,
                    ProductName = product.Name ?? $"Sản phẩm {productId}",
                    ProductImage = product.ImageUrl,
                    Quantity = quantity,
                    Price = price,
                    TotalCost = quantity * price
                };
                _context.CartItems.Add(item);
            }
            else
            {
                item.Quantity += quantity;
                item.TotalCost = item.Quantity * price;
                item.Price = price;
                _context.CartItems.Update(item);
            }

            await _context.SaveChangesAsync();
            await RecalculateTotalsAsync(userId);
            return cart;
        }

        // Tính lại tổng
        public async Task RecalculateTotalsAsync(int userId)
        {
            var cart = await _context.Carts.Include(c => c.CartItems)
                .FirstOrDefaultAsync(c => c.UserId == userId);
            if (cart is null) return;

            var sum = cart.CartItems.Sum(i => i.TotalCost ?? 0m);
            var discount = cart.Discount ?? 0m;
            cart.OriginalTotal = sum;
            cart.TotalCartPrice = Math.Max(0, sum - discount);

            await _context.SaveChangesAsync();
        }

        // Áp mã giảm giá (gọi sang DiscountService)
        public async Task<bool> ApplyDiscountAsync(int userId, string code)
        {
            var cart = await GetOrCreateCartAsync(userId);

            // subtotal để gửi sang DiscountService (decimal, không null)
            decimal original = cart.OriginalTotal ?? 0m;
            decimal current = cart.TotalCartPrice ?? 0m;
            decimal subtotalForApi = original > 0m ? original : current;

            var body = new { Code = code, OrderTotal = subtotalForApi };
            var resp = await _api.ApplyDiscountAsync(body);
            if (!resp.IsSuccessStatusCode) return false;

            var json = await resp.Content.ReadAsStringAsync();

            // Lấy discount theo cả 2 key: "DiscountAmount" (mới) hoặc "discount" (cũ)
            var jo = JObject.Parse(json);
            decimal discountAmount =
                  jo.Value<decimal?>("DiscountAmount")
               ?? jo.Value<decimal?>("discount")
               ?? 0m;

            // Chuẩn hóa subtotal để tính lại tổng bên Cart
            decimal subtotal = original > 0m ? original : current;

            cart.DiscountCode = string.IsNullOrWhiteSpace(code) ? null : code.Trim();
            cart.Discount = discountAmount;
            cart.TotalCartPrice = Math.Max(0m, subtotal - discountAmount);

            await _context.SaveChangesAsync();
            return true;
        }
    }
}
