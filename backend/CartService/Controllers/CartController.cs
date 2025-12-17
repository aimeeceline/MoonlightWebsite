using CartService.Model;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Json;

namespace CartService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Policy = "ActiveUser")]
    public class CartController : ControllerBase
    {
        private readonly CartDBContext _db;
        private readonly IHttpClientFactory _httpFactory;
        private readonly ServiceUrls _svc;

        public CartController(CartDBContext db, IHttpClientFactory httpFactory, IOptions<ServiceUrls> svc)
        {
            _db = db;
            _httpFactory = httpFactory;
            _svc = svc.Value;
        }

        // ========== Helpers ==========
        private int GetUserId()
        {
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier)
                      ?? User.FindFirstValue("uid")
                      ?? User.FindFirstValue("sub");

            if (int.TryParse(claim, out var id) && id > 0) return id;

            if (Request.Headers.TryGetValue("x-user-id", out var h) &&
                int.TryParse(h, out var hid) && hid > 0) return hid;

            return 0;
        }

        private async Task<Cart> GetOrCreateCartAsync(int userId)
        {
            var cart = await _db.Carts
                .Include(c => c.CartItems)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart is null)
            {
                cart = new Cart
                {
                    UserId = userId,
                    CreateDate = DateTime.UtcNow,
                    OriginalTotal = 0,
                    TotalCartPrice = 0,
                    Discount = 0,
                    DiscountCode = null,
                    Quantity = 0
                };
                _db.Carts.Add(cart);
                await _db.SaveChangesAsync();
            }

            return cart;
        }

        private static void Recalculate(Cart cart)
        {
            var items = cart.CartItems ?? new List<CartItem>();
            cart.Quantity = items.Sum(i => i.Quantity);
            cart.OriginalTotal = items.Sum(i => (i.TotalCost ?? 0m));
            var discount = cart.Discount ?? 0m;
            var total = (cart.OriginalTotal ?? 0m) - discount;
            cart.TotalCartPrice = total < 0 ? 0 : total;
        }

        private static string NormalizeImagePath(string? raw)
        {
            if (string.IsNullOrWhiteSpace(raw)) return string.Empty;
            if (Uri.TryCreate(raw, UriKind.Absolute, out var abs))
                return abs.AbsolutePath.TrimStart('/');
            return raw.Replace('\\', '/').TrimStart('/');
        }

        private static string? GetString(dynamic? obj, params string[] keys)
        {
            if (obj is null) return null;
            foreach (var k in keys)
            {
                try
                {
                    var val = obj?.GetProperty(k);
                    if (val is JsonElement je)
                    {
                        if (je.ValueKind == JsonValueKind.String) return je.GetString();
                        if (je.ValueKind != JsonValueKind.Null && je.ValueKind != JsonValueKind.Undefined)
                            return je.ToString();
                    }
                }
                catch { }

                try
                {
                    var val = obj?[k];
                    if (val is null) continue;
                    if (val is JsonElement je2)
                    {
                        if (je2.ValueKind == JsonValueKind.String) return je2.GetString();
                        if (je2.ValueKind != JsonValueKind.Null && je2.ValueKind != JsonValueKind.Undefined)
                            return je2.ToString();
                    }
                    return val?.ToString();
                }
                catch { }
            }
            return null;
        }

        private static decimal GetDecimal(dynamic? obj, params string[] keys)
        {
            foreach (var k in keys)
            {
                try
                {
                    var token = obj?.GetProperty(k);
                    if (token is JsonElement je)
                    {
                        if (je.ValueKind == JsonValueKind.Number && je.TryGetDecimal(out var dec)) return dec;
                        if (je.ValueKind == JsonValueKind.Number && je.TryGetDouble(out var d)) return Convert.ToDecimal(d);
                        if (je.ValueKind == JsonValueKind.String && decimal.TryParse(je.GetString(), out var ds)) return ds;
                    }
                }
                catch { }

                try
                {
                    var val = obj?[k];
                    if (val is null) continue;

                    if (val is JsonElement je2)
                    {
                        if (je2.ValueKind == JsonValueKind.Number && je2.TryGetDecimal(out var d2)) return d2;
                        if (je2.ValueKind == JsonValueKind.String && decimal.TryParse(je2.GetString(), out var ds2)) return ds2;
                    }
                    if (val is decimal dec) return dec;
                    if (val is double dbl) return Convert.ToDecimal(dbl);
                    if (val is float fl) return Convert.ToDecimal(fl);
                    if (val is int i) return i;
                    if (val is long l) return l;
                    if (decimal.TryParse(val.ToString(), out decimal any)) return any;
                }
                catch { }
            }
            return 0m;
        }

        private async Task<(string? name, string? image, decimal price)> FetchProductAsync(int productId, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(_svc.ProductService))
                return (null, null, 0m);

            var client = _httpFactory.CreateClient();
            try
            {
                var baseUrl = _svc.ProductService.TrimEnd('/');
                var urls = new[]
                {
                    $"{baseUrl}/api/Product/{productId}",
                    $"{baseUrl}/api/Products/{productId}",
                    $"{baseUrl}/api/Product/get/{productId}",
                    $"{baseUrl}/api/Product/detail/{productId}"
                };

                foreach (var url in urls)
                {
                    using var resp = await client.GetAsync(url, ct);
                    if (!resp.IsSuccessStatusCode) continue;

                    var root = await resp.Content.ReadFromJsonAsync<JsonElement?>(cancellationToken: ct);
                    if (root is null || root.Value.ValueKind == JsonValueKind.Undefined) continue;

                    var json = root.Value;
                    var payload = json.TryGetProperty("product", out var p) ? p
                                 : json.TryGetProperty("data", out var d) ? d
                                 : json.TryGetProperty("result", out var r) ? r
                                 : json;

                    string? name = GetString(payload, "name", "productName", "title");
                    string? image = GetString(payload, "imageProduct", "image", "productImage", "thumbnail", "imageUrl");
                    decimal price = GetDecimal(payload, "price", "unitPrice", "sellPrice");

                    return (name, image, price);
                }
            }
            catch { }

            return (null, null, 0m);
        }

        // Lấy CategoryName theo ProductId từ ProductService
        private async Task<string?> GetCat(int productId, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(_svc.ProductService)) return null;

            var client = _httpFactory.CreateClient();
            var baseUrl = _svc.ProductService.TrimEnd('/');
            var urls = new[]
            {
                $"{baseUrl}/api/Product/{productId}",
                $"{baseUrl}/api/Products/{productId}",
                $"{baseUrl}/api/Product/get/{productId}",
                $"{baseUrl}/api/Product/detail/{productId}"
            };

            foreach (var url in urls)
            {
                try
                {
                    using var resp = await client.GetAsync(url, ct);
                    if (!resp.IsSuccessStatusCode) continue;

                    var root = await resp.Content.ReadFromJsonAsync<JsonElement?>(cancellationToken: ct);
                    if (root is null || root.Value.ValueKind == JsonValueKind.Undefined) continue;

                    var json = root.Value;
                    var payload = json.TryGetProperty("product", out var p) ? p
                                 : json.TryGetProperty("data", out var d) ? d
                                 : json.TryGetProperty("result", out var r) ? r
                                 : json;

                    var cat = GetString(payload, "categoryName");
                    if (!string.IsNullOrWhiteSpace(cat)) return cat;

                    if (payload.TryGetProperty("category", out var cobj))
                    {
                        var catName = GetString(cobj, "name", "title", "label");
                        if (!string.IsNullOrWhiteSpace(catName)) return catName;
                    }
                }
                catch { }
            }
            return null;
        }

        // ========== Endpoints ==========

        // GET /api/Cart/me
        [HttpGet("me")]
        public async Task<IActionResult> GetMyCart()
        {
            var userId = GetUserId();
            if (userId <= 0) return BadRequest(new { message = "Thiếu userId" });

            var cart = await _db.Carts.Include(c => c.CartItems)
                                      .AsNoTracking()
                                      .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart is null)
            {
                return Ok(new
                {
                    cartId = 0,
                    userId,
                    createDate = DateTime.UtcNow,
                    originalTotal = 0m,
                    discount = 0m,
                    totalCartPrice = 0m,
                    discountCode = (string?)null,
                    quantity = 0,
                    items = Array.Empty<object>()
                });
            }

            var items = new List<object>();
            foreach (var i in cart.CartItems.OrderByDescending(x => x.CartItemId))
            {
                var price = i.Price ?? 0m;
                var qty = Math.Max(1, i.Quantity);

                // 👉 LẤY CATEGORY TỪ PRODUCT SERVICE (vì model không có cột)
                var category = await GetCat(i.ProductId);   // <<== thay cho i.CategoryName

                items.Add(new
                {
                    cartItemId = i.CartItemId,                 // FE cần
                    productId = i.ProductId,
                    productName = i.ProductName ?? "",
                    productImage = i.ProductImage ?? "",
                    categoryName = category ?? "",               // <<== dùng biến category
                    quantity = qty,
                    price = price,
                    totalCost = i.TotalCost ?? (price * qty)
                });
            }

            var subtotal = cart.OriginalTotal ?? cart.CartItems.Sum(x => x.TotalCost ?? 0m);
            var discount = cart.Discount ?? 0m;
            var grand = Math.Max(0, subtotal - discount);

            return Ok(new
            {
                cartId = cart.CartId,
                userId = cart.UserId,
                createDate = cart.CreateDate,
                originalTotal = subtotal,
                discount = discount,
                totalCartPrice = grand,
                discountCode = cart.DiscountCode,
                quantity = cart.Quantity,
                items
            });
        }

        // POST /api/Cart/add
        [HttpPost("add")]
        public async Task<IActionResult> AddItems([FromBody] AddCartItemRequest req, CancellationToken ct)
        {
            int userId = GetUserId();
            if (userId <= 0) return BadRequest(new { message = "Thiếu userId" });
            if (req?.Items == null || req.Items.Count == 0)
                return BadRequest(new { message = "Danh sách rỗng" });

            var cart = await GetOrCreateCartAsync(userId);
            await _db.Entry(cart).Collection(c => c.CartItems).LoadAsync(ct);

            foreach (var i in req.Items)
            {
                if (i.ProductId <= 0 || i.Quantity <= 0) continue;

                var existed = cart.CartItems.FirstOrDefault(x => x.ProductId == i.ProductId);
                if (existed != null)
                {
                    existed.Quantity += i.Quantity;
                    var price = existed.Price ?? 0m;
                    existed.TotalCost = price * existed.Quantity;
                }
                else
                {
                    var (name, image, price) = await FetchProductAsync(i.ProductId, ct);
                    var normalizedImage = NormalizeImagePath(image);

                    var newItem = new CartItem
                    {
                        ProductId = i.ProductId,
                        ProductName = name,
                        ProductImage = normalizedImage,
                        Quantity = i.Quantity,
                        Price = price,
                        TotalCost = price * i.Quantity
                    };
                    cart.CartItems.Add(newItem);
                }
            }

            Recalculate(cart);
            await _db.SaveChangesAsync(ct);

            return await GetMyCart();
        }

        // PUT /api/Cart/update/{itemId}
        [HttpPut("update/{itemId:int}")]
        public async Task<IActionResult> UpdateItem([FromRoute] int itemId, [FromBody] UpdateCartItemRequest req, CancellationToken ct)
        {
            int userId = GetUserId();
            if (userId <= 0) return BadRequest(new { message = "Thiếu userId" });
            if (req is null || req.Quantity <= 0) return BadRequest(new { message = "Số lượng không hợp lệ" });

            var cart = await GetOrCreateCartAsync(userId);
            await _db.Entry(cart).Collection(c => c.CartItems).LoadAsync(ct);

            var item = cart.CartItems.FirstOrDefault(x => x.CartItemId == itemId);
            if (item is null) return NotFound(new { message = "Không tìm thấy CartItem" });

            item.Quantity = req.Quantity;
            var price = item.Price ?? 0m;
            item.TotalCost = price * item.Quantity;

            Recalculate(cart);
            await _db.SaveChangesAsync(ct);

            return await GetMyCart();
        }

        // DELETE /api/Cart/remove/{itemId}
        [HttpDelete("remove/{itemId:int}")]
        public async Task<IActionResult> RemoveItem([FromRoute] int itemId, CancellationToken ct)
        {
            int userId = GetUserId();
            if (userId <= 0) return BadRequest(new { message = "Thiếu userId" });

            var cart = await GetOrCreateCartAsync(userId);
            await _db.Entry(cart).Collection(c => c.CartItems).LoadAsync(ct);

            var item = cart.CartItems.FirstOrDefault(x => x.CartItemId == itemId);
            if (item is null) return NotFound(new { message = "Không tìm thấy CartItem" });

            _db.CartItems.Remove(item);
            await _db.SaveChangesAsync(ct);

            await _db.Entry(cart).Collection(c => c.CartItems).LoadAsync(ct);
            Recalculate(cart);
            await _db.SaveChangesAsync(ct);

            return await GetMyCart();
        }
        // DELETE /api/Cart/clear
        [HttpDelete("clear")]
        public async Task<IActionResult> Clear(CancellationToken ct)
        {
            var userId = GetUserId();
            if (userId <= 0) return BadRequest(new { message = "Thiếu userId" });

            var cart = await _db.Carts
                .Include(c => c.CartItems)
                .FirstOrDefaultAsync(c => c.UserId == userId, ct);

            // Không có giỏ thì coi như đã trống
            if (cart is null)
            {
                return Ok(new
                {
                    cartId = 0,
                    userId,
                    createDate = DateTime.UtcNow,
                    originalTotal = 0m,
                    discount = 0m,
                    totalCartPrice = 0m,
                    discountCode = (string?)null,
                    quantity = 0,
                    items = Array.Empty<object>()
                });
            }

            // Xoá toàn bộ item
            _db.CartItems.RemoveRange(cart.CartItems);
            await _db.SaveChangesAsync(ct);

            // Reset lại các tổng và mã giảm giá
            cart.CartItems.Clear();
            cart.Quantity = 0;
            cart.OriginalTotal = 0m;
            cart.Discount = 0m;
            cart.DiscountCode = null;
            cart.TotalCartPrice = 0m;
            await _db.SaveChangesAsync(ct);

            // Trả về trạng thái giỏ sau khi dọn
            return await GetMyCart();
        }

        public class ApplyDiscountRequest { public string? Code { get; set; } public decimal OrderTotal { get; set; } }

        [HttpPut("discount")]
        public async Task<IActionResult> ApplyDiscount([FromBody] ApplyDiscountRequest dto, CancellationToken ct)
        {
            int userId = GetUserId();
            if (userId <= 0) return BadRequest(new { message = "Thiếu userId" });

            var cart = await GetOrCreateCartAsync(userId);
            await _db.Entry(cart).Collection(c => c.CartItems).LoadAsync(ct);

            var subtotal = cart.OriginalTotal ?? cart.CartItems.Sum(i => i.TotalCost ?? 0m);
            if (subtotal <= 0) return BadRequest(new { message = "Giỏ hàng trống." });

            var client = _httpFactory.CreateClient();
            var url = $"{_svc.DiscountService!.TrimEnd('/')}/api/Discount/apply-discount";

            using var resp = await client.PostAsJsonAsync(url, new { code = dto.Code, orderTotal = subtotal }, ct);
            if (!resp.IsSuccessStatusCode)
                return StatusCode((int)resp.StatusCode, await resp.Content.ReadAsStringAsync(ct));

            var result = await resp.Content.ReadFromJsonAsync<dynamic>(cancellationToken: ct);
            decimal discountAmount = (decimal?)result?.DiscountAmount ?? 0m;
            string code = (string?)result?.DiscountCode ?? dto.Code ?? "";

            cart.DiscountCode = string.IsNullOrWhiteSpace(code) ? null : code;
            cart.Discount = discountAmount;
            cart.OriginalTotal = subtotal;
            cart.TotalCartPrice = Math.Max(0, subtotal - discountAmount);
            await _db.SaveChangesAsync(ct);

            return await GetMyCart();
        }
    }
}
