using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using Shared.Contracts;

namespace OrdersService.Repository
{
    public class ApiClientHelper
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _config;

        private static readonly JsonSerializerOptions JsonOpts =
            new(JsonSerializerDefaults.Web) { PropertyNameCaseInsensitive = true };

        public ApiClientHelper(IHttpClientFactory httpClientFactory, IConfiguration config)
        {
            _httpClientFactory = httpClientFactory;
            _config = config;
        }

        private HttpClient CreateClient()
        {
            var handler = new HttpClientHandler
            {
                // chấp nhận self-signed cert trong dev/docker
                ServerCertificateCustomValidationCallback = (msg, cert, chain, errors) => true
            };
            return _httpClientFactory != null ? _httpClientFactory.CreateClient() : new HttpClient(handler);
        }

        private string ProductBaseUrl =>
            _config["Services:Product"] ?? "http://productservice:8080"; // sửa theo compose của bạn

        /// <summary>
        /// Lấy Product theo Id từ ProductService. Trả về ProductDto (schema tolerant).
        /// </summary>
        public async Task<ProductDto?> GetProductByIdAsync(int productId, string? bearerToken = null)
        {
            var http = CreateClient();
            if (!string.IsNullOrWhiteSpace(bearerToken))
                http.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue("Bearer", bearerToken);

            var url = $"{ProductBaseUrl}/api/Product/{productId}";
            using var res = await http.GetAsync(url);
            if (!res.IsSuccessStatusCode) return null;

            var json = await res.Content.ReadAsStringAsync();

            // a) thử parse trực tiếp
            try
            {
                var dto = JsonSerializer.Deserialize<ProductDto>(json, JsonOpts);
                if (dto != null && dto.ProductId > 0) return dto;
            }
            catch { /* ignore */ }

            // b) thử bóc { data: {...} } / { result: {...} } / { product: {...} } / array
            try
            {
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;

                if (root.ValueKind == JsonValueKind.Object)
                {
                    if (TryGetChild(root, "data", out var payload) ||
                        TryGetChild(root, "result", out payload) ||
                        TryGetChild(root, "product", out payload))
                    {
                        var dto = JsonSerializer.Deserialize<ProductDto>(payload.GetRawText(), JsonOpts);
                        if (dto != null && dto.ProductId > 0) return dto;
                    }
                }
                else if (root.ValueKind == JsonValueKind.Array && root.GetArrayLength() > 0)
                {
                    var first = root[0];
                    var dto = JsonSerializer.Deserialize<ProductDto>(first.GetRawText(), JsonOpts);
                    if (dto != null && dto.ProductId > 0) return dto;
                }
            }
            catch { /* ignore */ }

            return null;
        }

        private static bool TryGetChild(JsonElement root, string name, out JsonElement value)
        {
            if (root.TryGetProperty(name, out value)) return true;
            value = default;
            return false;
        }
    }
}
