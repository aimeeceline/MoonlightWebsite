using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Shared.Contracts;
using System.Net.Http.Headers;

namespace CartService.Repository
{
    // map với section "Services"
    public class ServiceUrls
    {
        public string? ProductService { get; init; }
        public string? DiscountService { get; init; }
        public string? UserService { get; init; }
    }

    public class ApiClientHelper
    {
        private readonly HttpClient _http;
        private readonly IHttpContextAccessor _ctx;
        private readonly ServiceUrls _urls;

        public ApiClientHelper(HttpClient http, IHttpContextAccessor ctx, IOptions<ServiceUrls> urls)
        {
            _http = http;
            _ctx = ctx;
            _urls = urls.Value;
        }

        // ---- URL nội bộ (fallback đúng tên container -dev) ----
        private string ProductBaseUrl => _urls.ProductService ?? "http://productservice-dev:8080";
        private string DiscountBaseUrl => _urls.DiscountService ?? "http://discountservice-dev:8080";
        private string UserBaseUrl => _urls.UserService ?? "http://userservice-dev:8080";

        // ---- Gắn Bearer nếu có trên request gốc ----
        private void AttachBearer(HttpRequestMessage req)
        {
            var raw = _ctx.HttpContext?.Request.Headers["Authorization"].ToString();
            if (!string.IsNullOrWhiteSpace(raw) && raw.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                var token = raw.Substring("Bearer ".Length).Trim();
                if (!string.IsNullOrEmpty(token))
                    req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            }
        }

        // ================= PRODUCTS =================
        public async Task<ProductDto?> GetProductByIdAsync(int id)
        {
            var url = $"{ProductBaseUrl}/api/Product/{id}";
            using var req = new HttpRequestMessage(HttpMethod.Get, url);
            AttachBearer(req); // có cũng không sao

            using var resp = await _http.SendAsync(req);
            if (!resp.IsSuccessStatusCode) return null;

            var json = await resp.Content.ReadAsStringAsync();

            // Unwrap nếu server trả { "product": {...} }, còn nếu phẳng thì dùng root luôn
            try
            {
                var root = JObject.Parse(json);
                var token = root["product"] ?? root;              // 👈 quan trọng
                return token.ToObject<ProductDto>();
            }
            catch
            {
                // fallback: nếu không phải JSON object, thử parse trực tiếp
                return JsonConvert.DeserializeObject<ProductDto>(json);
            }
        }

        // ================= DISCOUNT =================
        // body ví dụ: new { Code = dto.DiscountCode, OrderTotal = total }
        public async Task<HttpResponseMessage> ApplyDiscountAsync(object body)
        {
            var url = $"{DiscountBaseUrl}/api/Discount/apply";
            var json = JsonConvert.SerializeObject(body);

            using var req = new HttpRequestMessage(HttpMethod.Post, url)
            {
                Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json")
            };
            AttachBearer(req);

            return await _http.SendAsync(req);
        }

        // ================= USER =================
        // Ví dụ gọi sang UserService để tra cứu userId theo username (tuỳ bạn có endpoint này hay không)
        public async Task<int> GetUserIdByUsernameAsync(string username)
        {
            var url = $"{UserBaseUrl}/api/User/by-username/{Uri.EscapeDataString(username)}";
            using var req = new HttpRequestMessage(HttpMethod.Get, url);
            AttachBearer(req);

            using var resp = await _http.SendAsync(req);
            if (!resp.IsSuccessStatusCode) return 0;

            var json = await resp.Content.ReadAsStringAsync();
            dynamic obj = JsonConvert.DeserializeObject<dynamic>(json)!;
            return (int?)obj?.userId ?? 0;
        }
    }
}
