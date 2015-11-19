using System;

namespace Cow.Client
{
    public class Project
    {
        public string name { get; set; }
        public Tilelayer[] tilelayers { get; set; }
        public object layers { get; set; }
        public Status status { get; set; }
        public Type type { get; set; }
        public IncidentLocation incidentlocation { get; set; }
        public string description { get; set; }
        public DateTime date { get; set; }
        public Jsonlayer[] jsonlayers { get; set; }
        public string tmp { get; set; }
        public bool deleted { get; set; }

    }
}
