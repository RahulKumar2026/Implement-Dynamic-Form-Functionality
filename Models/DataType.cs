using System;
using System.Collections.Generic;

namespace Dynamic_Form.Models;

public partial class DataType
{
    public int DataTypeId { get; set; }

    public string DataTypeName { get; set; } = null!;

    public virtual ICollection<FormField> FormFields { get; set; } = new List<FormField>();
}
