namespace PBL6.Dto;

public class Department {
    public Department() { }

    public Department(Models.Department d)
    {
        Name = d.Name;
    }

    public string Name {get; set;} = String.Empty;
}

public class User {
    public User() { }

    public User(Models.User u)
    {
        FullName = u.FullName;
        IsAdmin = u.IsAdmin;

        Department = u.Department != null
            ? new Department(u.Department)
            : null;
    }

    public string FullName {get; set;} = String.Empty;

    public Department? Department {get; set;}

    public bool IsAdmin {get; set;} = false;
    public bool OnShift {get; set;} = false;
}

