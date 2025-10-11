using OrdersService.Model;

namespace OrdersService.Repository
{
    public class OrderRepository 
        : GenericRepository<Order>, IOrderRepository<Order>
    {
        public OrderRepository(OrderDBContext context) : base(context) { }
    }
}
