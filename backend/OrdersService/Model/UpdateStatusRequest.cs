using System.ComponentModel.DataAnnotations;

namespace OrdersService.Model
{
    public class UpdateStatusRequest
    {
        [Required, MaxLength(100)]
        public string Status { get; set; } = "Chờ xác nhận"; // Đang xử lý/Đã hủy/Đang giao/Thành công
    }
}
