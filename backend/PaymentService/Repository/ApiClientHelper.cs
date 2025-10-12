using System;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;
using System.Net;
using System.Text;
using Newtonsoft.Json;
using System.Net.Http.Headers;

namespace PaymentService.Repository
{
    public class ApiClientHelper
    {
        private readonly HttpClient _client;

        public ApiClientHelper()
        {
            // ⚠️ Bỏ qua kiểm tra chứng chỉ SSL
            var handler = new HttpClientHandler
            {
                ServerCertificateCustomValidationCallback =
                    (message, cert, chain, errors) => true
            };

            _client = new HttpClient(handler);
        }
        public async Task<string> GetStringAsync(string url, string token)
        {
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await _client.GetAsync(url);
            response.EnsureSuccessStatusCode(); // Ném lỗi nếu không thành công

            return await response.Content.ReadAsStringAsync();
        }

        // Phương thức GET
        public async Task<HttpResponseMessage> GetAsync(string baseUrl, string resource, string apiKey = null)
        {
            var queryString = HttpUtility.ParseQueryString(string.Empty);

            if (!string.IsNullOrEmpty(apiKey))
            {
                _client.DefaultRequestHeaders.Add("Ocp-Apim-Subscription-Key", apiKey);
            }

            var uri = $"{baseUrl}{resource}?{queryString}";
            var response = await _client.GetAsync(uri);
            return response;  // Trả về HttpResponseMessage
        }

        // Phương thức POST
        public async Task<HttpResponseMessage> PostAsync(string baseUrl, string resource, object data, string apiKey = null)
        {
            var content = new StringContent(JsonConvert.SerializeObject(data), Encoding.UTF8, "application/json");
            var uri = $"{baseUrl}{resource}";
            if (!string.IsNullOrEmpty(apiKey))
            {
                _client.DefaultRequestHeaders.Add("Ocp-Apim-Subscription-Key", apiKey);
            }

            var response = await _client.PostAsync(uri, content);
            return response;
        }
    }
}
