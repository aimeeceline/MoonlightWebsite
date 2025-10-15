namespace Shared.Contracts
{
    public class DiscountDto
    {
        public decimal OriginalTotal { get; set; }
        public decimal? DiscountAmount { get; set; }  // Số tiền giảm giá
        public decimal FinalTotal { get; set; }  // Tổng tiền sau khi áp dụng mã
        public string DiscountCode { get; set; } 
        // Mã giảm giá
    }
}