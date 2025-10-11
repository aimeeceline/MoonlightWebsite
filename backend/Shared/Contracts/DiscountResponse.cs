namespace CartService.Model
{
    public class DiscountResponse
    {
        public decimal OriginalTotal { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal FinalTotal { get; set; }
        public string DiscountCode { get; set; }
        public string Message { get; set; }
    }
}
