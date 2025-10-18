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
    [Authorize(Policy = "ActiveUser")] // chỉ user đang hoạt động mới thao tác giỏ
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

        // ==== Helpers ====
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

        private static string? GetString(dynamic? obj, params string[] keys)
        {
            if (obj is null) return null;
            foreach (var k in keys)
            {
                try
                {
                    var val = obj?.GetProperty(k); // nếu là JsonElement
                    if (val is JsonElement je)
                    {
                        if (je.ValueKind == JsonValueKind.String) return je.GetString();
                        if (je.ValueKind != JsonValueKind.Null && je.ValueKind != JsonValueKind.Undefined)
                            return je.ToString();
                    }
                }
                catch { /* ignore */ }

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
                catch { /* ignore */ }
            }
            return null;
        }

        private static decimal GetDecimal(dynamic? obj, params string[] keys)
        {
            // cố gắng đọc số từ JsonElement / number / string
            foreach (var k in keys)
            {
                try
                {
                    var token = obj?.GetProperty(k);
                    if (token is JsonElement je)
                    {
                        switch (je.ValueKind)
                        {
                            case JsonValueKind.Number:
                                if (je.TryGetDecimal(out var dec)) return dec;
                                if (je.TryGetDouble(out var d)) return Convert.ToDecimal(d);
                                break;
                            case JsonValueKind.String:
                                if (decimal.TryParse(je.GetString(), out var ds)) return ds;
                                break;
                        }
                    }
                }
                catch { /* ignore */ }

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
                catch { /* ignore */ }
            }
            return 0m;
        }

        private async Task<(string? name, string? image, decimal price)> FetchProductAsync(int productId)
        {
            if (string.IsNullOrWhiteSpace(_svc.ProductService))
                return (null, null, 0m);

            var client = _httpFactory.CreateClient();
            try
            {
                var urls = new[]
                {
            $"{_svc.ProductService.TrimEnd('/')}/api/Product/{productId}",
            $"{_svc.ProductService.TrimEnd('/')}/api/Products/{productId}",
            $"{_svc.ProductService.TrimEnd('/')}/api/Product/get/{productId}"
        };

                foreach (var url in urls)
                {
                    var resp = await client.GetAsync(url);
                    if (!resp.IsSuccessStatusCode) continue;

                    var root = await resp.Content.ReadFromJsonAsync<JsonElement?>(); // đọc JsonElement để xử lý linh hoạt
                    if (root is null || root.Value.ValueKind == JsonValueKind.Undefined) continue;

                    // ✅ hỗ trợ JSON bọc product/data/result
                    var json = root.Value;
                    var payload = json.TryGetProperty("product", out var p) ? p
                                 : json.TryGetProperty("data", out var d) ? d
                                 : json.TryGetProperty("result", out var r) ? r
                                 : json;

                    string? name = GetString(payload, "name", "productName", "title");
                    string? image = GetString(payload, "image", "productImage", "thumbnail");
                    decimal price = GetDecimal(payload, "price", "unitPrice", "sellPrice");

                    return (name, image, price);
                }
            }
            catch { /* ignore */ }

            return (null, null, 0m);
        }

        // ==== Endpoints ====

        // GET /api/Cart/me
        [HttpGet("me")]
        public async Task<IActionResult> GetMyCart()
        {
            int userId = GetUserId();
            if (userId <= 0) return BadRequest(new { message = "Thiếu userId" });

            var cart = await _db.Carts
                .Include(c => c.CartItems)
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart is null) return Ok(new
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

            var items = cart.CartItems
                .OrderByDescending(i => i.CartItemId)
                .Select(i => new {
                    i.CartItemId,
                    i.ProductId,
                    i.ProductName,
                    i.ProductImage,
                    i.Quantity,
                    price = i.Price ?? 0m,
                    totalCost = i.TotalCost ?? 0m
                }).ToList();

            return Ok(new
            {
                cartId = cart.CartId,
                userId = cart.UserId,
                createDate = cart.CreateDate,
                originalTotal = cart.OriginalTotal ?? 0m,
                discount = cart.Discount ?? 0m,
                totalCartPrice = cart.TotalCartPrice ?? 0m,
                discountCode = cart.DiscountCode,
                quantity = cart.Quantity,
                items
            });
        }

        // POST /api/Cart/add
        // Body: { "items": [ { "productId": 1, "quantity": 2 }, ... ] }
        [HttpPost("add")]
        public async Task<IActionResult> AddItems([FromBody] AddCartItemRequest req)
        {
            int userId = GetUserId();
            if (userId <= 0) return BadRequest(new { message = "Thiếu userId" });
            if (req?.Items == null || req.Items.Count == 0)
                return BadRequest(new { message = "Danh sách rỗng" });

            var cart = await GetOrCreateCartAsync(userId);
            await _db.Entry(cart).Collection(c => c.CartItems).LoadAsync();

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
                    // Gọi ProductService để lấy tên/hình/giá (nếu có)
                    var (name, image, price) = await FetchProductAsync(i.ProductId);

                    var newItem = new CartItem
                    {
                        ProductId = i.ProductId,
                        ProductName = name,
                        ProductImage = image,
                        Quantity = i.Quantity,
                        Price = price,
                        TotalCost = price * i.Quantity
                    };
                    cart.CartItems.Add(newItem);
                }
            }

            Recalculate(cart);
            await _db.SaveChangesAsync();

            return await GetMyCart();
        }

        // PUT /api/Cart/update/{itemId}
        [HttpPut("update/{itemId:int}")]
        public async Task<IActionResult> UpdateItem([FromRoute] int itemId, [FromBody] UpdateCartItemRequest req)
        {
            int userId = GetUserId();
            if (userId <= 0) return BadRequest(new { message = "Thiếu userId" });
            if (req is null || req.Quantity <= 0) return BadRequest(new { message = "Số lượng không hợp lệ" });

            var cart = await GetOrCreateCartAsync(userId);
            await _db.Entry(cart).Collection(c => c.CartItems).LoadAsync();

            var item = cart.CartItems.FirstOrDefault(x => x.CartItemId == itemId);
            if (item is null) return NotFound(new { message = "Không tìm thấy CartItem" });

            item.Quantity = req.Quantity;
            var price = item.Price ?? 0m;
            item.TotalCost = price * item.Quantity;

            Recalculate(cart);
            await _db.SaveChangesAsync();

            return await GetMyCart();
        }

        // DELETE /api/Cart/remove/{itemId}
        [HttpDelete("remove/{itemId:int}")]
        public async Task<IActionResult> RemoveItem([FromRoute] int itemId)
        {
            int userId = GetUserId();
            if (userId <= 0) return BadRequest(new { message = "Thiếu userId" });

            var cart = await GetOrCreateCartAsync(userId);
            await _db.Entry(cart).Collection(c => c.CartItems).LoadAsync();

            var item = cart.CartItems.FirstOrDefault(x => x.CartItemId == itemId);
            if (item is null) return NotFound(new { message = "Không tìm thấy CartItem" });

            _db.CartItems.Remove(item);
            await _db.SaveChangesAsync();

            // tải lại để tính
            await _db.Entry(cart).Collection(c => c.CartItems).LoadAsync();
            Recalculate(cart);
            await _db.SaveChangesAsync();

            return await GetMyCart();
        }

        // DELETE /api/Cart/clear
        [HttpDelete("clear")]
        public async Task<IActionResult> Clear()
        {
            int userId = GetUserId();
            if (userId <= 0) return BadRequest(new { message = "Thiếu userId" });

            var cart = await GetOrCreateCartAsync(userId);
            await _db.Entry(cart).Collection(c => c.CartItems).LoadAsync();

            _db.CartItems.RemoveRange(cart.CartItems);
            await _db.SaveChangesAsync();

            cart.CartItems.Clear();
            Recalculate(cart);
            await _db.SaveChangesAsync();

            return await GetMyCart();
        }
        public class ApplyDiscountRequest { public string? Code { get; set; } public decimal OrderTotal { get; set; } }

        [HttpPut("discount")]
        public async Task<IActionResult> ApplyDiscount([FromBody] ApplyDiscountRequest dto)
        {
            int userId = GetUserId();
            if (userId <= 0) return BadRequest(new { message = "Thiếu userId" });

            var cart = await GetOrCreateCartAsync(userId);
            await _db.Entry(cart).Collection(c => c.CartItems).LoadAsync();

            var subtotal = cart.OriginalTotal ?? cart.CartItems.Sum(i => i.TotalCost ?? 0m);
            if (subtotal <= 0) return BadRequest(new { message = "Giỏ hàng trống." });

            // Gọi DiscountService
            var client = _httpFactory.CreateClient();
            var url = $"{_svc.DiscountService!.TrimEnd('/')}/api/Discount/apply-discount";
            var resp = await client.PostAsJsonAsync(url, new { code = dto.Code, orderTotal = subtotal });
            if (!resp.IsSuccessStatusCode)
                return StatusCode((int)resp.StatusCode, await resp.Content.ReadAsStringAsync());

            var result = await resp.Content.ReadFromJsonAsync<dynamic>();
            decimal discountAmount = (decimal?)result?.DiscountAmount ?? 0m;
            string code = (string?)result?.DiscountCode ?? dto.Code ?? "";

            // Lưu vào Cart
            cart.DiscountCode = string.IsNullOrWhiteSpace(code) ? null : code;
            cart.Discount = discountAmount;
            cart.OriginalTotal = subtotal;
            cart.TotalCartPrice = Math.Max(0, subtotal - discountAmount);
            await _db.SaveChangesAsync();

            return await GetMyCart();
        }
    }
}
