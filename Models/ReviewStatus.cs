namespace PBL6.Models;

using StTup = (int Id, string Name);

public static class StatusIds {
    // Case waiting to be processed by model.
    public static readonly StTup Pending = (1, "Pending");

    // Case being processed by model.
    public static readonly StTup Processing = (2, "Processing");

    // Model has returned result, waiting for doc's approval.
    public static readonly StTup Done = (3, "Done");

    // Error happened during model detection process.
    public static readonly StTup Failed = (4, "Failed");

    // Doctor confirmed that patient doesn't have c. hemorrhage.
    public static readonly StTup Denied = (5, "Denied");

    // Doctor confirmed c. hemorrhage in the case.
    public static readonly StTup Confirmed = (6, "Confirmed");
}

public class ReviewStatus {
    public ReviewStatus() {}

    public ReviewStatus(StTup tup)
    {
        Id = tup.Id;
        Name = tup.Name;
    }

    public int Id {get; set;}
    public string Name {get; set;} = String.Empty;

    public ICollection<Case> Cases {get; set;}
        = new List<Case>();
}

