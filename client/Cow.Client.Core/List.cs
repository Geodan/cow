namespace Cow.Client
{
    public class List
    {
        public string _id { get; set; }
        public string status { get; set; }
        public long created { get; set; }
        public bool deleted { get; set; }
        public long updated { get; set; }
        public User data { get; set; }
        public Delta[] deltas { get; set; }
    }
}
