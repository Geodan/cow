using System;
using Newtonsoft.Json;

namespace Cow.Client
{
    public class CowMessage
    {
        public CowMessage(EnumAction action, Guid sender, Payload payload, Guid? target=null)
        {
            Action = action;
            Sender = sender;
            Payload = payload;
            Target = target;
        }

        [JsonProperty(PropertyName = "payload")]
        public Payload Payload { get; set; }
        [JsonProperty(PropertyName = "action")]
        public EnumAction Action { get; set; }
        [JsonProperty(PropertyName = "sender")]
        public Guid Sender { get; set; }
        [JsonProperty(PropertyName = "target")]
        public Guid? Target { get; set; }

    }
}
