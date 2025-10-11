namespace OrdersService.Model
{
    public class UpdateOrderInfoRequest
    {
        public string Address { get; set; }
        public string Phone { get; set; }
        public string Email { get; set; }
        public string Status { get; set; }
        public string Note { get; set; }
    }
}
