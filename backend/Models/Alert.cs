namespace PBL6.Models;

public class Alert {
    public int Id {get; set;}
    public bool Acknowledged {get; set;} = false;
    public DateTime? AcknowledgedTime {get; set;}
    public required DateTime SentAt {get; set;}

    public required int CaseId {get; set;}
    public Case? Case {get; set;}

    public required int SentToId {get; set;}
    public User? SentTo {get; set;}
}

