using System;
using System.Collections.Generic;

namespace DiscountService.Model
{
    public partial class Discount
    {
        public Discount()
        {
            DiscountUsages = new HashSet<DiscountUsage>();
        }

        public int DiscountId { get; set; }
        public string Code { get; set; } = null!;
        public string? Description { get; set; }
        public decimal? DiscountValue { get; set; }
        public decimal? MinOrderValue { get; set; }
        public DateTime? DateStart { get; set; }
        public DateTime? ExpirationDate { get; set; }
        public bool Status { get; set; }
        public DateTime? CreateDate { get; set; }

        public virtual ICollection<DiscountUsage> DiscountUsages { get; set; }
    }
}
