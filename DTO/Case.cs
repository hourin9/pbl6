namespace PBL6.Dtos;

public class ReviewStatusDto {
    public ReviewStatusDto() {}

    public ReviewStatusDto(Models.ReviewStatus r)
    {
        Name = r.Name;
    }

    public string Name {get; set;} = String.Empty;
}

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

        ReviewStatus = c.ReviewStatus != null
            ? new ReviewStatusDto(c.ReviewStatus)
            : null;
    }

    public int PriorityLevel {get; set;}
    public DateTime CreatedAt {get; set;}
    public DateTime? ReviewedAt {get; set;}

    public string Note {get; set;} = String.Empty;

    public PatientDto? Patient;
    public ReviewStatusDto? ReviewStatus;
}

public class CaseCreateDto {
    public string Note { get; set; } = String.Empty;
    public required int PatientId { get; set; }
    public required int ReviewerId { get; set; }
    public required int UploaderId { get; set; }

    public List<IFormFile> Images { get; set; } = new();
}

