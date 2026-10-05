public class ReviewStatus {
    public int Id {get; set;}
    public string Name {get; set;} = String.Empty;

    public ICollection<Case> Cases {get; set;}
        = new List<Case>();
}

