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
    public required string Name {get; set;}
    public required DateOnly DOB {get; set;}
}

