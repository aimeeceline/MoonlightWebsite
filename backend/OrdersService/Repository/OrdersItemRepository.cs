using OrdersService.Model;

namespace OrdersService.Repository
{
    public class OrdersItemRepository 
        : GenericRepository<OrdersItem>, IOrderRepository<OrdersItem>
    {
        public OrdersItemRepository(OrderDBContext context) : base(context) { }
    }
}
