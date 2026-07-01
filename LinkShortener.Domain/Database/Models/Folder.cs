using Microsoft.EntityFrameworkCore.Query;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace LinkShortener.Domain.Database.Models
{
    public class Folder
    {

        [Required, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int FolderId { get; set; }
        [Required]
        public DateTime CreatedAt { get; set; }
        [ForeignKey(nameof(User))]
        public required int UserId { get; set; }
        public virtual User User { get; set; } = null!;
        [Required]
        public string Slug { get; set; }

    }
}
