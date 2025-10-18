using Microsoft.EntityFrameworkCore;
using OrdersService.Model;

namespace OrdersService.Repository
{
    public class OrdersItemRepository : GenericRepository<OrdersItem>, IOrderRepository<OrdersItem>
    {
        public OrdersItemRepository(OrderDBContext context) : base(context) { }

        public Task<List<OrdersItem>> GetByOrderAsync(int orderId, CancellationToken ct = default)
        {
            return _context.OrdersItems.AsNoTracking()
                .Where(i => i.OrderId == orderId)
                .OrderBy(i => i.OrderItemId)
                .ToListAsync(ct);
        }
    }
}
