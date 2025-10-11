namespace OrdersService.Model
{
    public class OrderItemRequest
    {
        public int ProductId { get; set; } // <- thêm dòng này
        public int Quantity { get; set; }   // <- thêm dòng này
    }

    public class CreateOrderRequest
    {
        public List<OrderItemRequest> Items { get; set; } = new();
        public string? NameReceive { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? Address { get; set; }
        public string PaymentMethod { get; set; } = "COD";
        public string? Note { get; set; }
        public string? DiscountCode { get; set; }

        public decimal? Discount { get; set; }   // <- nullable
        public decimal? Ship { get; set; }       // <- nullable
    }
}