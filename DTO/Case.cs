namespace PBL6.Dtos;

public class CaseDto {
    public CaseDto() { }

    public CaseDto(Models.Case c)
    {
        PriorityLevel = c.PriorityLevel;
        CreatedAt = c.CreatedAt;
        ReviewedAt = c.ReviewedAt;
        Note = c.Note;

        Patient = c.Patient != null
            ? new PatientDto(c.Patient)
            : null;
    }

    public int PriorityLevel {get; set;}
    public DateTime CreatedAt {get; set;}
    public DateTime? ReviewedAt {get; set;}

    public string Note {get; set;} = String.Empty;

    public PatientDto? Patient;
}

