using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace OrdersService.Model
{
    public class OrderRequestDto
    {
        // Người nhận
        [Required, MaxLength(500)] public string NameReceive { get; set; } = string.Empty;
        [Required, MaxLength(20)] public string Phone { get; set; } = string.Empty;
        [Required, MaxLength(255), EmailAddress] public string Email { get; set; } = string.Empty;
        [Required, MaxLength(500)] public string Address { get; set; } = string.Empty;

        // Giảm giá & ship (nếu có)
        public string? DiscountCode { get; set; }   // nvarchar(50)
        public decimal? Discount { get; set; }      // decimal(18,2)
        public decimal? Ship { get; set; }          // decimal(18,2)

        // Thanh toán
        [MaxLength(100)] public string? PaymentMethod { get; set; } // COD/Online
        [MaxLength(100)] public string? PaymentStatus { get; set; } // Pending/Paid/...

        [MaxLength(500)] public string? Note { get; set; }          // ghi chú chung order

        [Required] public List<OrderItemRequest> Items { get; set; } = new();
    }

    public class OrderItemRequest
    {
        [Range(1, int.MaxValue)] public int ProductId { get; set; }
        [Required, MaxLength(500)] public string Name { get; set; } = string.Empty;
        [MaxLength(500)] public string? CategoryName { get; set; }
        [MaxLength(500)] public string? ImageProduct { get; set; }
        [Range(1, int.MaxValue)] public int Quantity { get; set; }
        [Range(0, double.MaxValue)] public decimal Price { get; set; }
        [MaxLength(1000)] public string? Note { get; set; }
    }
}
