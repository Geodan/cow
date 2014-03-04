namespace CowSignalR.Models
{
    public class CowMessage
    {
        public string action { get; set; }
        public string sender { get; set; }
        public string target { get; set; }
        public Payload payload { get; set; }
    }
}