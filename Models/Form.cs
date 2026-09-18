using System;
using System.Collections.Generic;

namespace Dynamic_Form.Models;

public partial class Form
{
    public int FormId { get; set; }

    public string FormName { get; set; } = null!;

    public DateTime? CreatedAt { get; set; }

    public virtual ICollection<FormField> FormFields { get; set; } = new List<FormField>();
}
