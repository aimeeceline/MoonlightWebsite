using System;
using System.Collections.Generic;

namespace DiscountService.Model
{
    public partial class DiscountUsage
    {
        public int UsageId { get; set; }
        public int? DiscountId { get; set; }
        public int? UserId { get; set; }
        public int? OrderId { get; set; }
        public DateTime? DateUsed { get; set; }

        public virtual Discount? Discount { get; set; }
    }
}
