using Dynamic_Form.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DynamicForm.Controllers
{
    [Route("api/datatype")]
    [ApiController]
    public class DataTypeController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DataTypeController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/datatype
        [HttpGet]
        public async Task<IActionResult> GetAllDataTypes()
        {
            var dataTypes = await _context.DataTypes
                .Select(x => new
                {
                    x.DataTypeId,
                    x.DataTypeName
                })
                .ToListAsync();

            return Ok(dataTypes);
        }


        // GET: api/datatype/1
        [HttpGet("{id}")]
        public async Task<IActionResult> GetDataType(int id)
        {
            var dataType = await _context.DataTypes
                .Where(x => x.DataTypeId == id)
                .Select(x => new
                {
                    x.DataTypeId,
                    x.DataTypeName
                })
                .FirstOrDefaultAsync();

            if (dataType == null)
            {
                return NotFound("Data type not found.");
            }

            return Ok(dataType);
        }
    }
}