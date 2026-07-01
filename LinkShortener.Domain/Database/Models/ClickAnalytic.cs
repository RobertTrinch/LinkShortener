using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace LinkShortener.Domain.Database.Models
{
    public class ClickAnalytic
    {

        [Required, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public Guid ClickAnalyticId { get; set; }

        [ForeignKey(nameof(ShortLink))]
        public required int ShortLinkId { get; set; }
        public virtual ShortLink ShortLink { get; set; } = null!;

        [Required]
        public DateTime ClickedAt { get; set; }
        
        public string Referrer { get; set; } = string.Empty;
        public string IpCountry { get; set; } = string.Empty;

    }
}
