namespace Shared.Contracts
{
    public class PaymentStatusResponse
    {
        public string Status { get; set; } = "";   // "Completed" | "Pending" | ...
        public int OrderId { get; set; }           // <-- thêm thuộc tính này
        public string? TransactionStatus { get; set; }
        public string? Message { get; set; }
    }
}
