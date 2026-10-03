class DbUtils {
    public static void NukeRestart(AppDbContext db)
    {
        db.Database.EnsureDeleted();
        db.Database.EnsureCreated();
    }
}

