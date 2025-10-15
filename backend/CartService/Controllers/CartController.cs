using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using CartService.Model;
using CartService.Repository;
using Shared.Contracts;

namespace CartService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CartController : Controller
    {
        private readonly CartRepository _cartRepo;
        private readonly CartItemRepository _cartItemRepo;
        private readonly ApiClientHelper _apiClientHelper;
        private readonly CartDBContext _context;

        public CartController(
            CartRepository cartRepo,
            CartItemRepository cartItemRepo,
            ApiClientHelper apiClientHelper,
            CartDBContext context)
        {
            _cartRepo = cartRepo;
            _cartItemRepo = cartItemRepo;
            _apiClientHelper = apiClientHelper;
            _context = context;
        }

        // -------- Helpers --------
        private static int? TryGetUserId(ClaimsPrincipal u)
        {
            var idStr =
                u.FindFirstValue(ClaimTypes.NameIdentifier) ??
                u.FindFirstValue("nameid") ??
                u.FindFirstValue("uid") ??
                u.FindFirstValue("sub");

            return int.TryParse(idStr, out var id) ? id : (int?)null;
        }

        // ========== ADD TO CART ==========
        [Authorize(Policy = "UserOnly")]
        [HttpPost("add-to-cart")]
        public async Task<IActionResult> AddToCart([FromBody] AddCartItemRequest request)
        {
            var userId = TryGetUserId(User);
            if (userId is null) return Unauthorized("Không tìm thấy thông tin người dùng.");
            if (!ModelState.IsValid) return BadRequest(ModelState);
            if (request?.Items == null || !request.Items.Any())
                return BadRequest("Danh sách sản phẩm trống.");

            // lấy/hoặc tạo giỏ
            var cart = await _context.Carts
                .Include(c => c.CartItems)
                .FirstOrDefaultAsync(c => c.UserId == userId)
                ?? new Cart
                {
                    UserId = userId.Value,
                    CreateDate = DateTime.Now,
                    TotalCartPrice = 0,
                    OriginalTotal = 0,
                    Quantity = 0,
                    CartItems = new List<CartItem>()
                };

            if (cart.CartId == 0)
            {
                _context.Carts.Add(cart);
                await _context.SaveChangesAsync();
            }

            foreach (var item in request.Items)
            {
                if (item.ProductId <= 0 || item.Quantity <= 0)
                    return BadRequest("productId/quantity không hợp lệ.");

                var product = await _apiClientHelper.GetProductByIdAsync(item.ProductId);
                if (product == null) return BadRequest($"Không tìm thấy sản phẩm với ID: {item.ProductId}");

                string? prodName = product.Name ?? product.ProductName;
                string? prodImg = product.Image ?? product.ProductImage ?? product.ImageUrl;
                decimal price = (product.Price ?? product.SalePrice ?? product.MinPrice) ?? 0m;

                var existing = cart.CartItems.FirstOrDefault(i => i.ProductId == item.ProductId);
                if (existing != null)
                {
                    existing.Quantity += item.Quantity;
                    existing.Price = price;
                    existing.TotalCost = price * existing.Quantity;
                    if (string.IsNullOrEmpty(existing.ProductName)) existing.ProductName = prodName;
                    if (string.IsNullOrEmpty(existing.ProductImage)) existing.ProductImage = prodImg;
                }
                else
                {
                    var newItem = new CartItem
                    {
                        CartId = cart.CartId,
                        ProductId = item.ProductId,
                        ProductName = prodName,
                        ProductImage = prodImg,
                        Quantity = item.Quantity,
                        Price = price,
                        TotalCost = price * item.Quantity
                    };
                    _context.CartItems.Add(newItem);
                    cart.CartItems.Add(newItem);
                }
            }

            await _context.SaveChangesAsync();

            // tính lại tổng
            var allItems = await _context.CartItems.Where(ci => ci.CartId == cart.CartId).ToListAsync();
            cart.Quantity = allItems.Sum(i => i.Quantity);
            cart.OriginalTotal = allItems.Sum(i => (i.Price ?? 0m) * i.Quantity);
            cart.TotalCartPrice = cart.OriginalTotal;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Đã thêm sản phẩm vào giỏ hàng.",
                totalCartPrice = cart.TotalCartPrice,
                originalTotal = cart.OriginalTotal,
                items = allItems.Select(i => new
                {
                    i.CartItemId,
                    i.ProductId,
                    i.ProductName,
                    i.ProductImage,
                    i.Price,
                    i.Quantity,
                    i.TotalCost
                })
            });
        }

        // ========== CART SUMMARY ==========
        [Authorize(Policy = "UserOnly")]
        [HttpGet("user-cart")]
        public async Task<IActionResult> GetCartByUserId()
        {
            var userId = TryGetUserId(User);
            if (userId is null) return Unauthorized("Không tìm thấy thông tin người dùng.");

            var cart = await _context.Carts
                .Where(c => c.UserId == userId)
                .Select(c => new
                {
                    c.TotalCartPrice,
                    c.OriginalTotal,
                    c.Quantity
                })
                .FirstOrDefaultAsync();

            if (cart == null) return NotFound("Không tìm thấy giỏ hàng cho user này.");
            return Ok(cart);
        }

        // ========== CART ITEMS ==========
        [Authorize(Policy = "UserOnly")]
        [HttpGet("user-cartItem")]
        public async Task<IActionResult> GetCartItem()
        {
            var userId = TryGetUserId(User);
            if (userId is null) return Unauthorized("Không tìm thấy thông tin người dùng.");

            var cart = await _context.Carts
                .Where(c => c.UserId == userId)
                .Include(c => c.CartItems)
                .Select(c => new
                {
                    c.CartId,
                    c.TotalCartPrice,
                    c.OriginalTotal,
                    c.Quantity,
                    c.Discount,
                    c.DiscountCode,
                    Items = c.CartItems.Select(ci => new
                    {
                        ci.CartItemId,
                        ci.ProductId,
                        ci.ProductName,
                        ci.ProductImage,
                        ci.Price,
                        ci.Quantity,
                        ci.TotalCost
                    }).ToList()
                })
                .FirstOrDefaultAsync();

            if (cart == null) return NotFound("Không tìm thấy giỏ hàng cho user này.");
            return Ok(cart);
        }

        // ========== UPDATE QTY ==========
        [Authorize(Policy = "UserOnly")]
        [HttpPut("update-item-quantity/{cartItemId}")]
        public async Task<IActionResult> UpdateItemQuantity(int cartItemId, [FromBody] UpdateCartItemRequest request)
        {
            var userId = TryGetUserId(User);
            if (userId is null) return Unauthorized("Không tìm thấy thông tin người dùng.");
            if (request.Quantity <= 0) return BadRequest("Số lượng phải lớn hơn 0.");

            var cartItem = _cartItemRepo.GetById(cartItemId);
            if (cartItem == null) return NotFound("Sản phẩm trong giỏ hàng không tồn tại.");
            if (cartItem.Cart == null || cartItem.Cart.UserId != userId)
                return Unauthorized("Không tìm thấy giỏ hàng hoặc không phải của bạn.");

            var product = await _apiClientHelper.GetProductByIdAsync(cartItem.ProductId);
            if (product == null) return NotFound($"Sản phẩm với ID {cartItem.ProductId} không tồn tại.");

            decimal price = (product.Price ?? product.SalePrice ?? product.MinPrice) ?? 0m;

            cartItem.Quantity = request.Quantity;
            cartItem.Price = price;
            cartItem.TotalCost = price * request.Quantity;
            _cartItemRepo.Update(cartItem);

            var cart = cartItem.Cart!;
            var all = _cartItemRepo.GetByCartId(cart.CartId);
            cart.Quantity = all.Sum(i => i.Quantity);
            cart.OriginalTotal = all.Sum(i => (i.Price ?? 0m) * i.Quantity);
            var discountAmount = cart.Discount ?? 0m;
            cart.TotalCartPrice = Math.Max((cart.OriginalTotal ?? 0m) - discountAmount, 0m);
            _cartRepo.Update(cart);

            var refreshed = _cartItemRepo.GetById(cartItemId)!;
            return Ok(new
            {
                Message = "Cập nhật số lượng sản phẩm thành công.",
                CartItem = new { refreshed.ProductId, refreshed.Quantity, refreshed.TotalCost },
                CartSummary = new
                {
                    TotalItemQuantity = cart.Quantity,
                    OriginalTotal = cart.OriginalTotal,
                    DiscountAmount = discountAmount,
                    TotalCartPrice = cart.TotalCartPrice
                }
            });
        }

        // ========== DELETE ITEM ==========
        [Authorize(Policy = "UserOnly")]
        [HttpDelete("delete-item/{cartItemId}")]
        public IActionResult DeleteCartItem(int cartItemId)
        {
            var userId = TryGetUserId(User);
            if (userId is null) return Unauthorized(new { Message = "Không tìm thấy thông tin người dùng." });

            var cartItem = _cartItemRepo.GetById(cartItemId);
            if (cartItem == null) return NotFound(new { Message = "Không tìm thấy sản phẩm trong giỏ hàng." });
            if (cartItem.Cart!.UserId != userId)
                return Unauthorized(new { Message = "Sản phẩm này không thuộc giỏ hàng của bạn." });

            _cartItemRepo.Delete(cartItem.CartItemId);

            var cart = _cartRepo.GetById(cartItem.CartId);
            if (cart != null)
            {
                var all = _cartItemRepo.GetByCartId(cart.CartId);
                cart.Quantity = all.Sum(i => i.Quantity);
                cart.OriginalTotal = all.Sum(i => (i.Price ?? 0m) * i.Quantity);
                var totalDiscount = cart.Discount ?? 0m;
                cart.TotalCartPrice = Math.Max((cart.OriginalTotal ?? 0m) - totalDiscount, 0m);

                if (cart.Quantity == 0)
                {
                    cart.TotalCartPrice = 0;
                    cart.OriginalTotal = 0;
                    cart.Discount = 0;
                    cart.DiscountCode = null;
                }
                _cartRepo.Update(cart);
            }

            return Ok(new
            {
                message = "Đã xóa sản phẩm thành công!!!",
                quantity = cart?.Quantity,
                originalTotal = cart?.OriginalTotal,
                totalCartPrice = cart?.TotalCartPrice,
                discount = cart?.Discount ?? 0,
                discountCode = cart?.DiscountCode
            });
        }

        // ========== APPLY DISCOUNT ==========
        [Authorize(Policy = "UserOnly")]
        [HttpPost("apply-discount")]
        public async Task<IActionResult> ApplyDiscount([FromBody] DiscountDto dto)
        {
            var userId = TryGetUserId(User);
            if (userId is null) return Unauthorized("Không tìm thấy thông tin người dùng.");

            var cart = await _context.Carts
                .Include(c => c.CartItems)
                .FirstOrDefaultAsync(c => c.UserId == userId);
            if (cart == null) return NotFound("Không tìm thấy giỏ hàng.");

            if (!cart.OriginalTotal.HasValue || cart.OriginalTotal == 0m)
                cart.OriginalTotal = cart.TotalCartPrice ?? 0m;

            if (!string.IsNullOrEmpty(cart.DiscountCode))
                return BadRequest("Giỏ hàng đã áp dụng mã giảm giá. Hủy mã trước khi áp dụng mã mới.");

            var body = new { Code = dto.DiscountCode, OrderTotal = cart.OriginalTotal ?? 0m };
            var resp = await _apiClientHelper.ApplyDiscountAsync(body);
            if (!resp.IsSuccessStatusCode)
            {
                var raw = await resp.Content.ReadAsStringAsync();
                return BadRequest($"Mã giảm giá không hợp lệ hoặc đã hết hạn. Phản hồi: {raw}");
            }

            var json = await resp.Content.ReadAsStringAsync();
            var result = JsonConvert.DeserializeObject<DiscountDto>(json);
            if (result == null || string.IsNullOrWhiteSpace(result.DiscountCode))
                return BadRequest("Phản hồi không hợp lệ từ DiscountService.");

            cart.DiscountCode = result.DiscountCode;
            cart.Discount = result.DiscountAmount ?? 0m;
            cart.TotalCartPrice = Math.Max((cart.OriginalTotal ?? 0m) - (result.DiscountAmount ?? 0m), 0m);

            _cartRepo.Update(cart);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Mã giảm giá đã được áp dụng thành công.",
                OriginalTotal = cart.OriginalTotal,
                DiscountAmount = cart.Discount,
                NewTotalCartPrice = cart.TotalCartPrice
            });
        }

        // ========== REMOVE DISCOUNT ==========
        [Authorize(Policy = "UserOnly")]
        [HttpDelete("remove-discount")]
        public async Task<IActionResult> RemoveDiscountFromCart()
        {
            var userId = TryGetUserId(User);
            if (userId is null) return Unauthorized("Không tìm thấy thông tin người dùng.");

            var cart = await _context.Carts
                .Include(c => c.CartItems)
                .FirstOrDefaultAsync(c => c.UserId == userId);
            if (cart == null) return NotFound("Không tìm thấy giỏ hàng.");

            if (!string.IsNullOrEmpty(cart.DiscountCode))
            {
                cart.TotalCartPrice = cart.OriginalTotal;
                cart.Discount = 0m;
                cart.DiscountCode = null;

                _cartRepo.Update(cart);
                await _context.SaveChangesAsync();
            }

            return Ok(new
            {
                Message = "Mã giảm giá đã được huỷ thành công.",
                OriginalTotal = cart.OriginalTotal,
                DiscountAmount = cart.Discount,
                NewTotalCartPrice = cart.TotalCartPrice
            });
        }

        // ========== CLEAR CART ==========
        [Authorize(Policy = "UserOrAdmin")]
        [HttpDelete("delete-cart")]
        public async Task<IActionResult> ClearCart()
        {
            var userId = TryGetUserId(User);
            if (userId is null) return Unauthorized("Không tìm thấy thông tin người dùng.");

            var carts = await _context.Carts.Where(c => c.UserId == userId).ToListAsync();
            if (!carts.Any()) return NotFound("Giỏ hàng đã trống.");

            var cartIds = carts.Select(c => c.CartId).ToList();
            var items = _context.CartItems.Where(ci => cartIds.Contains(ci.CartId));
            _context.CartItems.RemoveRange(items);
            _context.Carts.RemoveRange(carts);
            await _context.SaveChangesAsync();

            return Ok("Giỏ hàng đã được xóa.");
        }
    }
}
