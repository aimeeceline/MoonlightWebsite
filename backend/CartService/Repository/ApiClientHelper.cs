using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Shared.Contracts;

namespace CartService.Repository
{
    public class ApiClientHelper
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _config;

        // Json options: bỏ qua hoa/thường, mapping kiểu web
        private static readonly JsonSerializerOptions JsonOpts =
            new(JsonSerializerDefaults.Web)
            {
                PropertyNameCaseInsensitive = true
            };

        public ApiClientHelper(IHttpClientFactory httpClientFactory, IConfiguration config)
        {
            _httpClientFactory = httpClientFactory;
            _config = config;
        }

        private HttpClient CreateClient()
        {
            // nếu bạn có AddHttpClient trong Program.cs thì dùng factory;
            // nếu chưa, fallback tạo client tiêu chuẩn (accept self-signed).
            var handler = new HttpClientHandler
            {
                ServerCertificateCustomValidationCallback = (msg, cert, chain, errors) => true
            };

            return _httpClientFactory != null
                ? _httpClientFactory.CreateClient()
                : new HttpClient(handler);
        }

        private string ProductBaseUrl =>
            // ưu tiên ENV / appsettings, fallback hostname của compose (đổi port cho đúng dịch vụ của bạn)
            _config["Services:Product"] ??
            "http://productservice:8080";

        private string DiscountBaseUrl =>
            _config["Services:Discount"] ??
            "http://discountservice:8080";

        /// <summary>
        /// Lấy product theo id từ ProductService (trả về ProductDto; tolerant với schema).
        /// </summary>
        public async Task<ProductDto?> GetProductByIdAsync(int productId, string? bearerToken = null)
        {
            var http = CreateClient();
            var url = $"{ProductBaseUrl}/api/Product/{productId}";

            if (!string.IsNullOrWhiteSpace(bearerToken))
                http.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue("Bearer", bearerToken);

            using var res = await http.GetAsync(url);
            if (!res.IsSuccessStatusCode) return null;

            var json = await res.Content.ReadAsStringAsync();

            // cố gắng parse trực tiếp
            try
            {
                var direct = JsonSerializer.Deserialize<ProductDto>(json, JsonOpts);
                if (direct != null && direct.ProductId > 0) return direct;
            }
            catch { /* bỏ qua */ }

            // nếu api bọc { data: {...} } hoặc { product: {...} }
            try
            {
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;

                JsonElement payload;
                if (root.ValueKind == JsonValueKind.Object &&
                    (root.TryGetProperty("data", out payload) ||
                     root.TryGetProperty("result", out payload) ||
                     root.TryGetProperty("product", out payload)))
                {
                    var dto = JsonSerializer.Deserialize<ProductDto>(payload.GetRawText(), JsonOpts);
                    if (dto != null && dto.ProductId > 0) return dto;
                }

                if (root.ValueKind == JsonValueKind.Array && root.EnumerateArray().Any())
                {
                    var first = root[0];
                    var dto = JsonSerializer.Deserialize<ProductDto>(first.GetRawText(), JsonOpts);
                    if (dto != null && dto.ProductId > 0) return dto;
                }
            }
            catch { /* bỏ qua */ }

            return null;
        }

        /// <summary>
        /// Gọi DiscountService áp mã giảm giá. Body bạn truyền kiểu { Code = "...", OrderTotal = 123.45M }
        /// </summary>
        public async Task<HttpResponseMessage> ApplyDiscountAsync(object body, string? bearerToken = null)
        {
            var http = CreateClient();
            var url = $"{DiscountBaseUrl}/api/Discount/apply";

            if (!string.IsNullOrWhiteSpace(bearerToken))
                http.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue("Bearer", bearerToken);

            var content = new StringContent(
                JsonSerializer.Serialize(body, JsonOpts), Encoding.UTF8, "application/json");

            return await http.PostAsync(url, content);
        }
    }
}
