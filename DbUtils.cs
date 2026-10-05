class DbUtils {
    public static void NukeRestart(AppDbContext db)
    {
        db.Database.EnsureDeleted();
        db.Database.EnsureCreated();
    }

    public static void FillDefaultAccounts(AppDbContext db)
    {
        Patient p = new Patient {
            CCCD = "0123045609",
            Name = "Sissela",
            DOB = DateOnly.Parse("1/15/2004")
        };

        db.Patients.Add(p);

        User admin = new User {
            Name = "bigboss",
            FullName = "Le Van Big Boss",
            DepartmentId = 0,
            PasswordHash = "chol",
            IsAdmin = true,
        };

        db.Users.Add(admin);

        User doc = new User {
            Name = "charlotte",
            FullName = "Charlotte Ruisch",
            DepartmentId = 0,
            PasswordHash = "cisco123",
            IsAdmin = false,
        };

        db.Users.Add(doc);

        db.SaveChanges();
    }
}

