using Microsoft.EntityFrameworkCore;
using OrdersService.Model;

namespace OrdersService.Repository
{
    public class OrderRepository : GenericRepository<Order>, IOrderRepository<Order>
    {
        public OrderRepository(OrderDBContext context) : base(context) { }

        private static decimal Max0(decimal v) => v < 0 ? 0 : v;

        private static void Recalc(Order o)
        {
            var items = o.OrdersItems ?? new List<OrdersItem>();
            var sumLines = items.Sum(i => i.TotalCost ?? 0m);
            var discount = o.Discount ?? 0m;
            var ship = o.Ship ?? 0m;
            o.TotalCost = Max0(sumLines - discount + ship);
        }

        // ===== Domain APIs (dùng cho controller/service) =====

        public async Task<int> CreateAsync(int userId, OrderRequestDto dto, CancellationToken ct = default)
        {
            var order = new Order
            {
                UserId = userId,
                NameReceive = dto.NameReceive.Trim(),
                Phone = dto.Phone.Trim(),
                Email = dto.Email.Trim(),
                Address = dto.Address.Trim(),
                DiscountCode = string.IsNullOrWhiteSpace(dto.DiscountCode) ? null : dto.DiscountCode.Trim(),
                Discount = dto.Discount ?? 0m,
                Ship = dto.Ship ?? 0m,
                PaymentMethod = string.IsNullOrWhiteSpace(dto.PaymentMethod) ? "COD" : dto.PaymentMethod!.Trim(),
                PaymentStatus = string.IsNullOrWhiteSpace(dto.PaymentStatus) ? "Pending" : dto.PaymentStatus!.Trim(),
                Note = string.IsNullOrWhiteSpace(dto.Note) ? null : dto.Note!.Trim(),
                CreatedDate = DateTime.UtcNow,
                Status = "Chờ xác nhận"
            };

            foreach (var x in dto.Items)
            {
                var qty = Math.Max(1, x.Quantity);
                var price = Math.Max(0, x.Price);
                order.OrdersItems.Add(new OrdersItem
                {
                    ProductId = x.ProductId,
                    CategoryName = x.CategoryName,
                    Name = x.Name,
                    ImageProduct = x.ImageProduct,
                    SoLuong = qty,
                    Price = price,
                    TotalCost = price * qty,
                    Note = x.Note,
                    CreatedDate = DateTime.UtcNow
                });
            }

            Recalc(order);

            await _context.Orders.AddAsync(order, ct);
            await _context.SaveChangesAsync(ct);
            return order.OrderId;
        }

        public async Task<object?> GetDetailAsync(int userId, int orderId, CancellationToken ct = default)
        {
            var o = await _context.Orders.Include(x => x.OrdersItems)
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.OrderId == orderId && x.UserId == userId, ct);
            if (o is null) return null;

            return new
            {
                o.OrderId,
                o.UserId,
                o.CreatedDate,
                o.Status,
                o.NameReceive,
                o.Phone,
                o.Email,
                o.Address,
                o.Note,
                o.Discount,
                o.Ship,
                o.DiscountCode,
                o.PaymentMethod,
                o.PaymentStatus,
                o.TotalCost,
                items = o.OrdersItems.Select(i => new {
                    i.OrderItemId,
                    i.ProductId,
                    i.CategoryName,
                    i.Name,
                    i.ImageProduct,
                    quantity = i.SoLuong,
                    price = i.Price ?? 0m,
                    totalCost = i.TotalCost ?? 0m,
                    i.Note
                }).ToList()
            };
        }

        public Task<List<object>> GetMyAsync(int userId, CancellationToken ct = default)
        {
            return _context.Orders.AsNoTracking()
                .Where(o => o.UserId == userId)
                .OrderByDescending(o => o.OrderId)
                .Select(o => new
                {
                    o.OrderId,
                    o.CreatedDate,
                    o.Status,
                    o.TotalCost,
                    o.Discount,
                    o.Ship,
                    o.DiscountCode,
                    o.PaymentMethod,
                    o.PaymentStatus
                } as object)
                .ToListAsync(ct);
        }

        public async Task<bool> CancelAsync(int userId, int orderId, CancellationToken ct = default)
        {
            var o = await _context.Orders.FirstOrDefaultAsync(x => x.OrderId == orderId && x.UserId == userId, ct);
            if (o is null) return false;
            if (o.Status is "Đang giao" or "Thành công") return false;
            o.Status = "Đã hủy";
            await _context.SaveChangesAsync(ct);
            return true;
        }

        // ===== Admin =====
        public new Task<List<object>> GetAllAsync(CancellationToken ct = default)
        {
            return _context.Orders.AsNoTracking()
                .OrderByDescending(o => o.OrderId)
                .Select(o => new
                {
                    o.OrderId,
                    o.UserId,
                    o.CreatedDate,
                    o.Status,
                    o.TotalCost,
                    o.Discount,
                    o.Ship,
                    o.DiscountCode,
                    o.PaymentMethod,
                    o.PaymentStatus
                } as object).ToListAsync(ct);
        }

        public async Task<bool> UpdateStatusAsync(int orderId, string status, CancellationToken ct = default)
        {
            var o = await _context.Orders.FirstOrDefaultAsync(x => x.OrderId == orderId, ct);
            if (o is null) return false;
            o.Status = status;
            await _context.SaveChangesAsync(ct);
            return true;
        }

        public async Task<bool> UpdateInfoAsync(int orderId, UpdateOrderInfoRequest req, CancellationToken ct = default)
        {
            var o = await _context.Orders.Include(x => x.OrdersItems).FirstOrDefaultAsync(x => x.OrderId == orderId, ct);
            if (o is null) return false;

            if (!string.IsNullOrWhiteSpace(req.NameReceive)) o.NameReceive = req.NameReceive!.Trim();
            if (!string.IsNullOrWhiteSpace(req.Phone)) o.Phone = req.Phone!.Trim();
            if (!string.IsNullOrWhiteSpace(req.Email)) o.Email = req.Email!.Trim();
            if (!string.IsNullOrWhiteSpace(req.Address)) o.Address = req.Address!.Trim();
            if (!string.IsNullOrWhiteSpace(req.Note)) o.Note = req.Note!.Trim();
            if (!string.IsNullOrWhiteSpace(req.PaymentMethod)) o.PaymentMethod = req.PaymentMethod!.Trim();
            if (!string.IsNullOrWhiteSpace(req.PaymentStatus)) o.PaymentStatus = req.PaymentStatus!.Trim();
            if (!string.IsNullOrWhiteSpace(req.DiscountCode)) o.DiscountCode = req.DiscountCode!.Trim();
            if (req.Discount.HasValue) o.Discount = Math.Max(0, req.Discount.Value);
            if (req.Ship.HasValue) o.Ship = Math.Max(0, req.Ship.Value);

            Recalc(o);
            await _context.SaveChangesAsync(ct);
            return true;
        }
    }
}
