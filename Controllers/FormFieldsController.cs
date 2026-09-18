using Dynamic_Form.DTOs;
using Dynamic_Form.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DynamicForm.Controllers
{
    [Route("api/form")]
    [ApiController]
    public class FormController : ControllerBase
    {
        private readonly AppDbContext _context;

        public FormController(AppDbContext context)
        {
            _context = context;
        }


   
        // POST - CREATE FORM
     

        [HttpPost]
        public async Task<IActionResult> AddAsync(FormRequestDto request)
        {
        
            // VALIDATION
           

            if (request == null)
            {
                return BadRequest("Form data is required.");
            }

            if (string.IsNullOrWhiteSpace(request.FormName))
            {
                return BadRequest("Form name is required.");
            }

            if (request.Fields == null || request.Fields.Count == 0)
            {
                return BadRequest("At least one field is required.");
            }


       
            // CREATE FORM
          
            var form = new Form
            {
                FormName = request.FormName.Trim(),

                // PostgreSQL column is timestamp without time zone
                CreatedAt = DateTime.SpecifyKind(
                    DateTime.UtcNow,
                    DateTimeKind.Unspecified)
            };


         
            // ADD FORM FIELDS


            foreach (var item in request.Fields)
            {
                // Validate field name
                if (string.IsNullOrWhiteSpace(item.FieldName))
                {
                    return BadRequest("Field name is required.");
                }


                // Validate datatype
                if (item.DataTypeId <= 0)
                {
                    return BadRequest(
                        $"Invalid DataTypeId for field '{item.FieldName}'.");
                }


                // Check datatype exists
                var dataTypeExists = await _context.DataTypes
                    .AnyAsync(x =>
                        x.DataTypeId == item.DataTypeId);

                if (!dataTypeExists)
                {
                    return BadRequest(
                        $"Invalid DataTypeId: {item.DataTypeId}");
                }


                
                // CREATE FORM FIELD
                

                var field = new FormField
                {
                    FieldName = item.FieldName.Trim(),

                    FieldValue = item.FieldValue,

                    DataTypeId = item.DataTypeId,

                    IsRequired = item.IsRequired,

                    IsActive = true,

                    IsDeleted = false
                };


              
                // ADD OPTIONS
          

                if (item.Options != null &&
                    item.Options.Count > 0)
                {
                    foreach (var option in item.Options)
                    {
                        if (string.IsNullOrWhiteSpace(option))
                        {
                            continue;
                        }


                        var fieldOption = new FieldOption
                        {
                            OptionValue = option.Trim(),

                            IsActive = true,

                            IsDeleted = false
                        };


                        field.FieldOptions.Add(fieldOption);
                    }
                }


         
                // CONNECT FORM FIELD TO FORM
    

                form.FormFields.Add(field);
            }


    
            // SAVE FORM


            _context.Forms.Add(form);

            await _context.SaveChangesAsync();


        
            // RESPONSE
 

            return Ok(new
            {
                form.FormId,

                form.FormName,

                form.CreatedAt,

                Fields = form.FormFields
                    .Select(field => new
                    {
                        field.FormFieldId,

                        field.FieldName,

                        field.FieldValue,

                        field.DataTypeId,

                        field.IsRequired,

                        Options = field.FieldOptions
                            .Select(option => new
                            {
                                option.OptionId,

                                option.OptionValue
                            })
                            .ToList()
                    })
                    .ToList()
            });
        }


      
        // GET ALL FORMS
       

        [HttpGet]
        public async Task<IActionResult> GetAllForms()
        {
            var result = await (
                from form in _context.Forms

                join field in _context.FormFields
                    on form.FormId equals field.FormId

                join dataType in _context.DataTypes
                    on field.DataTypeId equals dataType.DataTypeId

                where field.IsActive
                      && !field.IsDeleted

                select new
                {
                    FormId = form.FormId,

                    FormName = form.FormName,

                    CreatedAt = form.CreatedAt,

                    FormFieldId = field.FormFieldId,

                    FieldName = field.FieldName,

                    FieldValue = field.FieldValue,

                    DataTypeId = field.DataTypeId,

                    DataTypeName = dataType.DataTypeName,

                    IsRequired = field.IsRequired,

                    IsActive = field.IsActive,

                    IsDeleted = field.IsDeleted
                }
            )
            .ToListAsync();


            return Ok(result);
        }


     
        // GET FORM BY ID

        [HttpGet("{id}")]
        public async Task<IActionResult> GetForm(int id)
        {
            var form = await _context.Forms
                .Include(x => x.FormFields)
                    .ThenInclude(x => x.DataType)
                .Include(x => x.FormFields)
                    .ThenInclude(x => x.FieldOptions)
                .FirstOrDefaultAsync(x => x.FormId == id);

            if (form == null)
            {
                return NotFound("Form not found.");
            }

            var response = new
            {
                form.FormId,
                form.FormName,
                form.CreatedAt,

                Fields = form.FormFields
                    .Where(x => x.IsActive && !x.IsDeleted)
                    .Select(field => new
                    {
                        field.FormFieldId,
                        field.FieldName,
                        field.FieldValue,
                        field.DataTypeId,
                        DataTypeName = field.DataType.DataTypeName,
                        field.IsRequired,
                        field.IsActive,
                        field.IsDeleted,

                        Options = field.FieldOptions
                            .Where(x => x.IsActive && !x.IsDeleted)
                            .Select(option => new
                            {
                                option.OptionId,
                                option.OptionValue
                            })
                            .ToList()
                    })
                    .ToList()
            };

            return Ok(response);
        }

      
        // PUT - UPDATE FORM
     
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateForm(
            int id,
            FormRequestDto request)
        {
          
            // VALIDATION
       

            if (request == null)
            {
                return BadRequest("Form data is required.");
            }

            if (string.IsNullOrWhiteSpace(request.FormName))
            {
                return BadRequest("Form name is required.");
            }

            if (request.Fields == null ||
                request.Fields.Count == 0)
            {
                return BadRequest("At least one field is required.");
            }


          
            // FIND EXISTING FORM
       

            var form = await _context.Forms

                .Include(x => x.FormFields)

                .ThenInclude(x => x.FieldOptions)

                .FirstOrDefaultAsync(x => x.FormId == id);


            if (form == null)
            {
                return NotFound(
                    $"Form with ID {id} not found.");
            }


          
            // UPDATE FORM NAME
            form.FormName = request.FormName.Trim();


           
            // PROCESS REQUEST FIELDS
         

            foreach (var item in request.Fields)
            {
                // VALIDATE FIELD NAME
                
                if (string.IsNullOrWhiteSpace(item.FieldName))
                {
                    return BadRequest(
                        "Field name is required.");
                }


              
                // VALIDATE DATA TYPE
             

                if (item.DataTypeId <= 0)
                {
                    return BadRequest(
                        $"Invalid DataTypeId for field '{item.FieldName}'.");
                }


               
                // CHECK DATA TYPE EXISTS
                
                var dataTypeExists =
                    await _context.DataTypes
                        .AnyAsync(x =>
                            x.DataTypeId == item.DataTypeId);


                if (!dataTypeExists)
                {
                    return BadRequest(
                        $"Invalid DataTypeId: {item.DataTypeId}");
                }


                
                // FIND EXISTING FIELD
              

                FormField? existingField = null;


                if (item.FormFieldId > 0)
                {
                    existingField =
                        form.FormFields
                            .FirstOrDefault(x =>
                                x.FormFieldId ==
                                item.FormFieldId);
                }


                // UPDATE EXISTING FIELD
             

                if (existingField != null)
                {
                    existingField.FieldName =
                        item.FieldName.Trim();

                    existingField.FieldValue =
                        item.FieldValue;

                    existingField.DataTypeId =
                        item.DataTypeId;

                    existingField.IsRequired =
                        item.IsRequired;

                    existingField.IsActive =
                        item.IsActive;

                    existingField.IsDeleted =
                        item.IsDeleted;


                    
                    // REMOVE OLD OPTIONS
                

                    existingField.FieldOptions.Clear();



                    // ADD NEW OPTIONS
                   

                    if (item.Options != null &&
                        item.Options.Count > 0)
                    {
                        foreach (var option in item.Options)
                        {
                            if (string.IsNullOrWhiteSpace(option))
                            {
                                continue;
                            }


                            existingField.FieldOptions.Add(
                                new FieldOption
                                {
                                    OptionValue =
                                        option.Trim(),

                                    IsActive = true,

                                    IsDeleted = false
                                });
                        }
                    }
                }


                // ADD NEW FIELD
               

                else
                {
                    var newField = new FormField
                    {
                        FieldName =
                            item.FieldName.Trim(),

                        FieldValue =
                            item.FieldValue,

                        DataTypeId =
                            item.DataTypeId,

                        IsRequired =
                            item.IsRequired,

                        IsActive = true,

                        IsDeleted = false
                    };


                    
                    // ADD OPTIONS TO NEW FIELD
                

                    if (item.Options != null &&
                        item.Options.Count > 0)
                    {
                        foreach (var option in item.Options)
                        {
                            if (string.IsNullOrWhiteSpace(option))
                            {
                                continue;
                            }


                            newField.FieldOptions.Add(
                                new FieldOption
                                {
                                    OptionValue =
                                        option.Trim(),

                                    IsActive = true,

                                    IsDeleted = false
                                });
                        }
                    }


                   
                    // CONNECT NEW FIELD TO FORM
                  

                    form.FormFields.Add(newField);
                }
            }


           
            // SAVE CHANGES
          

            await _context.SaveChangesAsync();


            return Ok(new
            {
                form.FormId,

                form.FormName,

                form.CreatedAt,

                Fields = form.FormFields

                    .Where(field =>
                        field.IsActive &&
                        !field.IsDeleted)

                    .Select(field => new
                    {
                        field.FormFieldId,

                        field.FieldName,

                        field.FieldValue,

                        field.DataTypeId,

                        field.IsRequired,

                        Options = field.FieldOptions

                            .Where(option =>
                                option.IsActive &&
                                !option.IsDeleted)

                            .Select(option => new
                            {
                                option.OptionId,

                                option.OptionValue
                            })

                            .ToList()
                    })

                    .ToList()
            });
        }
    }
}