public class AuditLog {
    public int Id {get; set;}

    public required int UserId {get; set;}
    public User? User {get; set;}

    public required string Action;
    public DateTime CreatedAt {get; set;} = DateTime.Now;
}

