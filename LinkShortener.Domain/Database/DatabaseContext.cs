using LinkShortener.Domain.Database.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace LinkShortener.Domain.Database
{
    public class DatabaseContext : DbContext
    {

        public DatabaseContext(DbContextOptions options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<ShortLink> ShortLinks { get; set; }
        public DbSet<Folder> Folders { get; set; }
        public DbSet<ClickAnalytic> ClickAnalytics { get; set; }

    }
}
