public class Patient {
    public int Id {get; set;}
    public string? CCCD {get; set;}
    public required string Name {get; set;}
    public required DateOnly DOB {get; set;}

    public ICollection<Case> History {get; set;}
        = new List<Case>();
}

