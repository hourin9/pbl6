using Microsoft.EntityFrameworkCore;

public class AppDbContext : DbContext {
    public AppDbContext(DbContextOptions<AppDbContext> opts) : base(opts) { }

    public DbSet<Department> Departments {get; set;}
    public DbSet<ReviewStatus> ReviewStatuses {get; set;}
    public DbSet<User> Users {get; set;}

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
    }
}

