using System;
using System.Collections.Generic;

namespace Dynamic_Form.Models;

public partial class FieldOption
{
    public int OptionId { get; set; }

    public int FormFieldId { get; set; }

    public string OptionValue { get; set; } = null!;

    public bool IsActive { get; set; }

    public bool IsDeleted { get; set; }

    public virtual FormField FormField { get; set; } = null!;
}
