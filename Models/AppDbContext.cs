using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace Dynamic_Form.Models;

public partial class AppDbContext : DbContext
{
    public AppDbContext()
    {
    }

    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<DataType> DataTypes { get; set; }

    public virtual DbSet<FieldOption> FieldOptions { get; set; }

    public virtual DbSet<Form> Forms { get; set; }

    public virtual DbSet<FormField> FormFields { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        => optionsBuilder.UseNpgsql("Name=ConnectionStrings:DefaultConnection");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<DataType>(entity =>
        {
            entity.HasKey(e => e.DataTypeId).HasName("DataTypes_pkey");

            entity.Property(e => e.DataTypeName).HasMaxLength(50);
        });

        modelBuilder.Entity<FieldOption>(entity =>
        {
            entity.HasKey(e => e.OptionId).HasName("FieldOptions_pkey");

            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.OptionValue).HasMaxLength(255);

            entity.HasOne(d => d.FormField).WithMany(p => p.FieldOptions)
                .HasForeignKey(d => d.FormFieldId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_FieldOptions_FormFields");
        });

        modelBuilder.Entity<Form>(entity =>
        {
            entity.HasKey(e => e.FormId).HasName("Forms_pkey");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.FormName).HasMaxLength(100);
        });

        modelBuilder.Entity<FormField>(entity =>
        {
            entity.HasKey(e => e.FormFieldId).HasName("FormFields_pkey");

            entity.Property(e => e.FieldName).HasMaxLength(100);
            entity.Property(e => e.FieldValue).HasMaxLength(500);
            entity.Property(e => e.IsActive).HasDefaultValue(true);

            entity.HasOne(d => d.DataType).WithMany(p => p.FormFields)
                .HasForeignKey(d => d.DataTypeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_FormFields_DataTypes");

            entity.HasOne(d => d.Form).WithMany(p => p.FormFields)
                .HasForeignKey(d => d.FormId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_FormFields_Forms");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
