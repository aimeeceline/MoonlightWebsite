using System.ComponentModel.DataAnnotations;

namespace CartService.Model
{ 
    public class AddCartItemRequest
    {
       public List<CartItemRequest> Items { get; set; } = new();    
}
    // Cập nhật số lượng sản phẩm mới
    public class CartItemRequest
    {
        [Range(1, int.MaxValue)] public int ProductId { get; set; }
        [Range(1, int.MaxValue)] public int Quantity { get; set; }
    }
    public class UpdateCartItemRequest
    {
        [Range(1, int.MaxValue)] public int Quantity { get; set; }
    }


    public class CartItemDto
    {
        public int ProductId { get; set; }
        public string? ProductName { get; set; }
        public string? ProductImage { get; set; }
        public int Quantity { get; set; }
        public decimal? Price { get; set; }
        public decimal? TotalCost { get; set; }
    }
}