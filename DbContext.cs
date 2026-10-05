using Microsoft.EntityFrameworkCore;

public class AppDbContext : DbContext {
    public AppDbContext(DbContextOptions<AppDbContext> opts) : base(opts) { }

    public DbSet<Department> Departments {get; set;}
    public DbSet<ReviewStatus> ReviewStatuses {get; set;}
    public DbSet<User> Users {get; set;}
    public DbSet<Case> Cases {get; set;}

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);

        b.Entity<User>(e => {
            e.HasKey(u => u.Id);

            e.HasOne(u => u.Department)
                .WithMany(d => d.Users)
                .HasForeignKey(u => u.DepartmentId)
                .IsRequired();
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
                .IsRequired();

            e.HasOne(c => c.ReviewStatus)
                .WithMany(r => r.Cases)
                .HasForeignKey(c => c.StatusId)
                .IsRequired()
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}

