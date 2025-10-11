using System.Text.Json.Serialization;

namespace Shared.Contracts
{
    public class CategoryDto
    {
        [JsonPropertyName("name")]         public string? Name { get; set; }
        [JsonPropertyName("categoryName")] public string? CategoryName { get; set; }
    }
}
