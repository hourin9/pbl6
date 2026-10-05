public class DetectionResult {
    public int Id {get; set;}

    public required int ScanImageId {get; set;}
    public ScanImage? ScanImage {get; set;}

    public required bool HasHemorrhage {get; set;}
    public required string HemorrhageType {get; set;}
    public required string Location {get; set;}

    // MM3
    public required float Volume {get; set;}

    public required float Confidence {get; set;}
    public required string HeatmapPath {get; set;}

    public DateTime CreatedAt {get; set;} = DateTime.Now;
}

