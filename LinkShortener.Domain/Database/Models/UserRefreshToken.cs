using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace LinkShortener.Domain.Database.Models
{
    public class UserRefreshToken
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public string Token { get; set; } = null!;

        [Required]
        [ForeignKey(nameof(User))]
        public int UserId { get; set; }

        [DeleteBehavior(DeleteBehavior.Cascade)]
        public virtual User User { get; set; } = null!;

        [Required]
        public DateTime ExpiresAt { get; set; }

        [Required]
        public bool IsRevoked { get; set; } = false;
    }
}