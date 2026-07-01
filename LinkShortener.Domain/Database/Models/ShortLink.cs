using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace LinkShortener.Domain.Database.Models
{
    public class ShortLink
    {
        [Required, DatabaseGenerated(DatabaseGeneratedOption.Identity)] 
        public int ShortLinkId { get; set; }
        [Required]
        public DateTime CreatedAt { get; set; }

        [ForeignKey(nameof(User))]
        public required int UserId { get; set; }
        public virtual User User { get; set; } = null!;
        [Required]
        public string Slug { get; set; }
        [Required]
        public string Url { get; set; }

        [ForeignKey(nameof(Folder))]
        public int? FolderId { get; set; } = null!;
        public virtual Folder Folder { get; set; } = null!;
    }
}
