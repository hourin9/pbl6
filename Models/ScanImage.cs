public class ScanImage {
    public int Id {get; set;}

    public required string FilePath {get; set;}

    public required int CaseId {get; set;}
    public Case? Case {get; set;}

    public required int UploaderId {get; set;}
    public User? UploadedBy {get; set;}

    public DetectionResult? Result {get; set;}
}

