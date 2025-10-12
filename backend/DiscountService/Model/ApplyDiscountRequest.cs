namespace DiscountService.Model
{
    public class ApplyDiscountRequest
    {
        public string Code { get; set; } = null!;
        public decimal OrderTotal { get; set; }
    }
}
