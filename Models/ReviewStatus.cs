namespace PBL6.Models;

public static class StatusIds {
    public const int Pending = 1;
    public const int Processing = 2;
    public const int Done = 3;
    public const int Failed = 4;
}

public class ReviewStatus {
    public int Id {get; set;}
    public string Name {get; set;} = String.Empty;

    public ICollection<Case> Cases {get; set;}
        = new List<Case>();
}

