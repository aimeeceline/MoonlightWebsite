namespace OrdersService.Model
{
    public class PaymentResponse
    {
        public int paymentId { get; set; }
        public int orderId { get; set; }
        public string status { get; set; }
        public decimal totalPrice { get; set; }
        public string transactionStatus { get; set; }
    }
}
