using System;

namespace Cow.Client
{
    public class Record
    {
        public string _id { get; set; }
        public string status { get; set; }
        public long created { get; set; }
        public bool deleted { get; set; }
        public long updated { get; set; }
        public dynamic data { get; set; }
        public Delta[] deltas { get; set; }
    }
}
