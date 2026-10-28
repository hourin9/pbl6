namespace PBL6.Dto;

public class User {
    public string FullName {get; set;} = String.Empty;

    public Models.Department? Department {get; set;}

    public bool IsAdmin {get; set;} = false;
    public bool OnShift {get; set;} = false;
}

