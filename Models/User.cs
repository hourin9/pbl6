namespace PBL6.Models;

public class User {
    public int Id {get; set;}
    public required string Name {get; set;}
    public required string PasswordHash {get; set;}
    public required string FullName {get; set;}

    public required int DepartmentId {get; set;}
    public Department? Department {get; set;}

    public bool IsAdmin {get; set;} = false;
    public bool OnShift {get; set;} = false;

    public ICollection<Case> Cases {get; set;}
        = new List<Case>();

    public ICollection<ScanImage> Images {get; set;}
        = new List<ScanImage>();
}

