using System;
using System.Collections.Generic;

namespace ProductService.Model
{
    public partial class Product
    {
        public int ProductId { get; set; }
        public int CategoryId { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public string DescriptionDetails { get; set; } = "";
        public string Image { get; set; } = null!;
        public string Image1 { get; set; } = null!;
        public string Image2 { get; set; } = null!;
        public string Image3 { get; set; } = null!;
        public decimal Price { get; set; }
        public int Inventory { get; set; }
        public int ViewCount { get; set; }
        public DateTime CreateDate { get; set; }
        public bool Status { get; set; } = true;
        public DateTime? UpdatedAt { get; set; }

        public virtual Category? Category { get; set; }
    }
}
