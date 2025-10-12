using System;
using System.Collections.Generic;

namespace CartService.Model
{
    public partial class Cart
    {
        public Cart()
        {
            CartItems = new HashSet<CartItem>();
        }

        public int CartId { get; set; }
        public int UserId { get; set; }
        public DateTime CreateDate { get; set; }
        public decimal? OriginalTotal { get; set; }
        public decimal? TotalCartPrice { get; set; }
        public decimal? Discount { get; set; }
        public string DiscountCode { get; set; }

        public int Quantity { get; set; }
        public virtual ICollection<CartItem> CartItems { get; set; }
    }
}
