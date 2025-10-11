using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

public partial class Product
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int ProductId { get; set; }

    public int CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string DescriptionDetails { get; set; } = string.Empty;
    public string Image { get; set; } = string.Empty;
    public string Image1 { get; set; } = string.Empty;
    public string Image2 { get; set; } = string.Empty;
    public string Image3 { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Inventory { get; set; }
    public int ViewCount { get; set; }
    public DateTime CreateDate { get; set; }
    public bool Status { get; set; } = true;
    public DateTime? UpdatedAt { get; set; }

    public virtual Category? Category { get; set; }
}