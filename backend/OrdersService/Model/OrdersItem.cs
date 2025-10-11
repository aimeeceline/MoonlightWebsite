using System;
using System.Collections.Generic;

namespace OrdersService.Model
{
    public partial class OrdersItem
    {
        public int OrderItemId { get; set; }
        public int? OrderId { get; set; }
        public string? NameReceive { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? Address { get; set; }
        public int? ProductId { get; set; }
        public string? ImageProduct { get; set; }
        public string? Name { get; set; }
        public string? CategoryName { get; set; }
        public int? SoLuong { get; set; }
        public decimal? Price { get; set; }
        public decimal? Discount { get; set; }
        public decimal? Ship { get; set; }
        public DateTime CreatedDate { get; set; }
        public string? PaymentMethod { get; set; }
        public string? PaymentStatus { get; set; }
        public decimal? TotalCost { get; set; }
        public string? Note { get; set; }

        public virtual Order? Order { get; set; }
    }
}
