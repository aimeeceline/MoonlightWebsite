using System.ComponentModel.DataAnnotations;

namespace OrdersService.Model
{
    public class UpdateOrderInfoRequest
    {
        [MaxLength(500)] public string? NameReceive { get; set; }
        [MaxLength(20)] public string? Phone { get; set; }
        [MaxLength(255), EmailAddress] public string? Email { get; set; }
        [MaxLength(500)] public string? Address { get; set; }
        [MaxLength(500)] public string? Note { get; set; }

        [MaxLength(100)] public string? PaymentMethod { get; set; }
        [MaxLength(100)] public string? PaymentStatus { get; set; }

        public string? DiscountCode { get; set; }
        public decimal? Discount { get; set; }
        public decimal? Ship { get; set; }
    }
}
