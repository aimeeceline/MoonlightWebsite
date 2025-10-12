using System;
using System.Collections.Generic;

namespace PaymentService.Model
{
    public partial class Payment
    {
        public int PaymentId { get; set; }
        public int OrderId { get; set; }
        public int UserId { get; set; }
        public string PaymentMethod { get; set; } = null!;
        public DateTime PaymentDate { get; set; }
        public string TransactionId { get; set; } = null!;
        public string? ReferenceNumber { get; set; }  // Thêm cột này
        public decimal TotalPrice { get; set; }
        public string Status { get; set; } = null!;
        public string? Description { get; set; }
        public string? Note { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? OrderCode { get; set; }
        public DateTime? ExpirationTime { get; set; }
    }
}
