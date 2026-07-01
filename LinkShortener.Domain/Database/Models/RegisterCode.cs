using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace LinkShortener.Domain.Database.Models
{
    public class RegisterCode
    {
        [Required, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public Guid RegisterCodeId { get; set; }
        [Required]
        public int Code { get; set; }
        [Required]
        public string Email { get; set; }

    }
}
