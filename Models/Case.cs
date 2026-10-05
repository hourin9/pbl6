public class Case {
    public int Id {get; set;}
    public int PriorityLevel {get; set;} = 0;
    public required DateTime CreatedAt {get; set;}
    public DateTime? ReviewedAt {get; set;}
    public string Note {get; set;} = String.Empty;

    public required int ReviewerId {get; set;}
    public User? ReviewedBy {get; set;}

    public required int StatusId {get; set;}
    public ReviewStatus? ReviewStatus {get; set;}
}

