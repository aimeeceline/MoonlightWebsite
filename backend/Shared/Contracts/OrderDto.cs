namespace PaymentService.Model
{
    public class OrderDto
    {
        public int OrderId { get; set; }
        public int UserId { get; set; }
        public string OrderCode { get; set; }      // Mã đơn hàng
        public DateTime CreatedAt { get; set; }    // Thời gian tạo đơn hàng
        public string Status { get; set; }
    }
}
