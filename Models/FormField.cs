using System;
using System.Collections.Generic;

namespace Dynamic_Form.Models;

public partial class FormField
{
    public int FormFieldId { get; set; }

    public int FormId { get; set; }

    public string FieldName { get; set; } = null!;

    public string? FieldValue { get; set; }

    public int DataTypeId { get; set; }

    public bool IsRequired { get; set; }

    public bool IsActive { get; set; }

    public bool IsDeleted { get; set; }

    public virtual DataType DataType { get; set; } = null!;

    public virtual ICollection<FieldOption> FieldOptions { get; set; } = new List<FieldOption>();

    public virtual Form Form { get; set; } = null!;
}
