using Microsoft.EntityFrameworkCore;

public class AppDbContext : DbContext {
    public AppDbContext(DbContextOptions<AppDbContext> opts) : base(opts) { }

    public DbSet<Alert> Alerts {get; set;}
    public DbSet<Case> Cases {get; set;}
    public DbSet<Department> Departments {get; set;}
    public DbSet<Patient> Patients {get; set;}
    public DbSet<ReviewStatus> ReviewStatuses {get; set;}
    public DbSet<ScanImage> ScanImages {get; set;}
    public DbSet<User> Users {get; set;}

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);

        b.Entity<User>(e => {
            e.HasKey(u => u.Id);

            e.HasOne(u => u.Department)
                .WithMany(d => d.Users)
                .HasForeignKey(u => u.DepartmentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<Department>(e => {
            e.HasKey(d => d.Id);
        });

        b.Entity<ReviewStatus>().HasKey(r => r.Id);

        b.Entity<Case>(e => {
            e.HasKey(c => c.Id);

            e.HasOne(c => c.ReviewedBy)
                .WithMany(u => u.Cases)
                .HasForeignKey(c => c.ReviewerId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(c => c.ReviewStatus)
                .WithMany(r => r.Cases)
                .HasForeignKey(c => c.StatusId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(c => c.Patient)
                .WithMany(p => p.History)
                .HasForeignKey(c => c.PatientId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<ScanImage>(e => {
            e.HasKey(s => s.Id);

            e.HasOne(s => s.Case)
                .WithMany(c => c.Images)
                .HasForeignKey(s => s.CaseId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(s => s.UploadedBy)
                .WithMany(u => u.Images)
                .HasForeignKey(s => s.UploaderId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Alert>(e => {
            e.HasKey(a => a.Id);

            e.HasOne(a => a.SentTo)
                .WithMany()
                .HasForeignKey(a => a.SentToId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(a => a.Case)
                .WithMany()
                .HasForeignKey(a => a.CaseId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}

