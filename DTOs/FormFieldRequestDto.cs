namespace Dynamic_Form.DTOs
{
    public class FormFieldRequestDto
    {
        public int FormFieldId { get; set; }

        public string FieldName { get; set; } = string.Empty;

        public string? FieldValue { get; set; }

        public int DataTypeId { get; set; }

        public bool IsRequired { get; set; }

        public bool IsActive { get; set; }

        public bool IsDeleted { get; set; }

        public List<string> Options { get; set; } = new();
    }
}