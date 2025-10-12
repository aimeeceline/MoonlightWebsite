namespace CartService.Model
{ 
    public class AddCartItemsRequest
    {
       public List<CartItemRequest> Items { get; set; } = new();    
}
    // Cập nhật số lượng sản phẩm mới
    public class UpdateCartItemRequest
    {
        public int Quantity { get; set; }  // Số lượng mới của sản phẩm
    }

    public class CartItemRequest
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
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