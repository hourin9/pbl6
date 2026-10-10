using PBL6.Models;

class DbUtils {
    public static void NukeRestart(AppDbContext db)
    {
        db.Database.EnsureDeleted();
        db.Database.EnsureCreated();
    }

    public static void FillDefaultDepartments(AppDbContext db)
    {
        var deps = new List<Department> {
            new Department { Name = "Tai Mui Hong" },
            new Department { Name = "Tim mach" },
            new Department { Name = "Ho hap" },
            new Department { Name = "Nao" },
        };

        db.Departments.AddRange(deps);
        db.SaveChanges();
    }

    public static void FillDefaultAccounts(AppDbContext db)
    {
        Patient p = new Patient {
            CCCD = "0123045609",
            Name = "Sissela",
            DOB = DateOnly.Parse("1/15/2004")
        };

        db.Patients.Add(p);

        Department tmp;
        try {
            tmp = db.Departments.First();
        } catch (ArgumentNullException) {
            Console.WriteLine("Call FillDefaultDepartments() first");
            return;
        }

        User admin = new User {
            Name = "bigboss",
            FullName = "Le Van Big Boss",
            DepartmentId = tmp.Id,
            PasswordHash = "chol",
            IsAdmin = true,
        };

        db.Users.Add(admin);

        User doc = new User {
            Name = "charlotte",
            FullName = "Charlotte Ruisch",
            DepartmentId = tmp.Id,
            PasswordHash = "cisco123",
            IsAdmin = false,
        };

        db.Users.Add(doc);

        db.SaveChanges();
    }
}

