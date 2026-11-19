namespace PBL6.Dtos;

public class PatientDto {
    public PatientDto() { }

    public PatientDto(Models.Patient p)
    {
        CCCD = p.CCCD;
        Name = p.Name;
        DOB = p.DOB;
    }

    public string? CCCD {get; set;}
    public string Name {get; set;} = String.Empty;
    public DateOnly DOB {get; set;}
}

