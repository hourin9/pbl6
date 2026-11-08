namespace PBL6.Models;

public static class StatusIds {
    // Case waiting to be processed by model.
    public const int Pending = 1;

    // Case being processed by model.
    public const int Processing = 2;

    // Model has returned result, waiting for doc's approval.
    public const int Done = 3;

    // Error happened during model detection process.
    public const int Failed = 4;

    // Doctor confirmed that patient doesn't have c. hemorrhage.
    public const int Denied = 5;

    // Doctor confirmed c. hemorrhage in the case.
    public const int Confirmed = 6;
}

public class ReviewStatus {
    public int Id {get; set;}
    public string Name {get; set;} = String.Empty;

    public ICollection<Case> Cases {get; set;}
        = new List<Case>();
}

