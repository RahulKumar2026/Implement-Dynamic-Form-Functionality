namespace Dynamic_Form.DTOs
{
    public class FormRequestDto
    {
        public string FormName { get; set; } = string.Empty;

        public List<FormFieldRequestDto> Fields { get; set; } = new();
    }
}