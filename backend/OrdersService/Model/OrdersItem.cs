using System;

namespace OrdersService.Model
{
    public partial class OrdersItem
    {
        public int OrderItemId { get; set; }
        public int OrderId { get; set; }

        // Sản phẩm
        public int ProductId { get; set; }
        public string? CategoryName { get; set; } // nvarchar(500)
        public string? Name { get; set; }         // nvarchar(500)
        public string? ImageProduct { get; set; } // nvarchar(500)

        // Số lượng & giá
        public int SoLuong { get; set; }          // quantity
        public decimal? Price { get; set; }       // decimal(18,2)
        public decimal? TotalCost { get; set; }   // decimal(18,2)

        // Ghi chú từng dòng + thời gian tạo dòng
        public string? Note { get; set; }         // nvarchar(1000)
        public DateTime CreatedDate { get; set; }

        public virtual Order Order { get; set; } = null!;
    }
}
