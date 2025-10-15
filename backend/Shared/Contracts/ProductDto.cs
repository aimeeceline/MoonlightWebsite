using System.Text.Json.Serialization;

namespace Shared.Contracts
{
    public class ProductDto
    {
        // ID chuẩn (gộp productId)
        [JsonPropertyName("productId")]
        public int ProductId { get; set; }

        // ---- Tên sản phẩm: chấp nhận nhiều biến thể ----
        [JsonPropertyName("name")]         public string? Name { get; set; }
        [JsonPropertyName("productName")]  public string? ProductName { get; set; }

        // ---- Ảnh: nhiều biến thể ----
        [JsonPropertyName("image")]        public string? Image { get; set; }
        [JsonPropertyName("productImage")] public string? ProductImage { get; set; }
        [JsonPropertyName("imageUrl")]     public string? ImageUrl { get; set; }

        // ---- Giá: nhiều biến thể ----
        [JsonPropertyName("price")]     public decimal? Price { get; set; }
        [JsonPropertyName("salePrice")] public decimal? SalePrice { get; set; }
        [JsonPropertyName("minPrice")]  public decimal? MinPrice { get; set; }

        // ---- Category: tên phẳng & object lồng (nhiều biến thể) ----
        [JsonPropertyName("categoryName")] public string? CategoryName { get; set; }
        [JsonPropertyName("category")]     public CategoryDto? Category { get; set; }
        [JsonPropertyName("categoryDto")]  public CategoryDto? CategoryDto { get; set; }

        // ============ Helpers hợp nhất cho code gọi phía ngoài ============

        [JsonIgnore]
        public int IdOrProductId => ProductId; // nếu API nguồn gửi "productId", hãy map sang "id" trước khi emit

        [JsonIgnore]
        public string DisplayName =>
            !string.IsNullOrWhiteSpace(Name) ? Name :
            !string.IsNullOrWhiteSpace(ProductName) ? ProductName : "-";

        [JsonIgnore]
        public string DisplayImage =>
            !string.IsNullOrWhiteSpace(ImageUrl) ? ImageUrl :
            !string.IsNullOrWhiteSpace(ProductImage) ? ProductImage :
            !string.IsNullOrWhiteSpace(Image) ? Image : string.Empty;

        [JsonIgnore]
        public decimal DisplayPrice =>
            Price ?? SalePrice ?? MinPrice ?? 0m;

        [JsonIgnore]
        public string DisplayCategoryName =>
            !string.IsNullOrWhiteSpace(CategoryName) ? CategoryName :
            (!string.IsNullOrWhiteSpace(Category?.Name) ? Category!.Name :
             !string.IsNullOrWhiteSpace(Category?.CategoryName) ? Category!.CategoryName :
             !string.IsNullOrWhiteSpace(CategoryDto?.Name) ? CategoryDto!.Name :
             !string.IsNullOrWhiteSpace(CategoryDto?.CategoryName) ? CategoryDto!.CategoryName : "-");
    }
}