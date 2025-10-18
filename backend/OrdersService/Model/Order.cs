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

        // ===== Thông tin người nhận (từ ERD) =====
        public string? NameReceive { get; set; }   // nvarchar(500)
        public string? Phone { get; set; }         // nvarchar(20)
        public string? Email { get; set; }         // nvarchar(255)
        public string? Address { get; set; }       // nvarchar(500)

        // ===== Tổng tiền & ghi chú =====
        public decimal? TotalCost { get; set; }    // decimal(18,2)
        public string? Note { get; set; }          // nvarchar(500)

        // ===== Thời gian & trạng thái =====
        public DateTime CreatedDate { get; set; }
        public string? Status { get; set; }        // Chờ xác nhận / Đang xử lý / Đã hủy / Đang giao / Thành công

        // ===== Giảm giá & phí ship =====
        public decimal? Discount { get; set; }     // decimal(18,2)
        public decimal? Ship { get; set; }         // decimal(18,2)
        public string? DiscountCode { get; set; }  // nvarchar(50)

        // ===== Thanh toán (nằm ở Order theo ERD mới) =====
        public string? PaymentMethod { get; set; } // nvarchar(100) (COD/Online/...)
        public string? PaymentStatus { get; set; } // nvarchar(100) (Pending/Paid/Failed/Refunded)

        public virtual ICollection<OrdersItem> OrdersItems { get; set; }
    }
}
