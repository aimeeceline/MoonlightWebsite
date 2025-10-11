using System;
using System.Collections.Generic;

namespace OrdersService.Model
{
    public partial class Order
    {
        public Order()
        {
            OrdersItems = new HashSet<OrdersItem>();
        }

        public int OrderId { get; set; }
        public int UserId { get; set; }
        public decimal? TotalCost { get; set; }
        public DateTime? CreatedDate { get; set; }
        public string? Status { get; set; }
        public decimal? Discount { get; set; }  // Thêm Discount
        public decimal? Ship { get; set; }
        public string? DiscountCode { get; set; }
        public virtual ICollection<OrdersItem> OrdersItems { get; set; }
    }
}
