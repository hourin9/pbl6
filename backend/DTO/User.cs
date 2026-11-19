namespace PBL6.Dtos;

public class DepartmentDto {
    public DepartmentDto() { }

    public DepartmentDto(Models.Department d)
    {
        Name = d.Name;
    }

    public string Name {get; set;} = String.Empty;
}

public class UserDto {
    public UserDto() { }

    public UserDto(Models.User u)
    {
        FullName = u.FullName;
        IsAdmin = u.IsAdmin;

        Department = u.Department != null
            ? new DepartmentDto(u.Department)
            : null;
    }

    public string FullName {get; set;} = String.Empty;

    public DepartmentDto? Department {get; set;}

    public bool IsAdmin {get; set;} = false;
    public bool OnShift {get; set;} = false;
}

