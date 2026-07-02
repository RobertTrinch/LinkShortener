using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LinkShortener.Domain.Database.Migrations
{
    /// <inheritdoc />
    public partial class registercodesactive : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "RegisterCodes",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "RegisterCodes");
        }
    }
}
