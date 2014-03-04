using System.Threading.Tasks;
using CowSignalR.Models;
using Microsoft.AspNet.SignalR;
using Newtonsoft.Json;

namespace CowSignalR
{
    public class CowHub : Hub
    {
        public override Task OnConnected()
        {
            Clients.Others.userConnected(Context.ConnectionId);
            return base.OnConnected();
        }

        public override Task OnDisconnected()
        {
            Clients.Others.userDisconnected(Context.ConnectionId);
            return base.OnDisconnected();
        }

        public override Task OnReconnected()
        {
            Clients.Others.userReconnected(Context.ConnectionId);
            return base.OnDisconnected();
        }

        public void Send(string message)
        {
            if (!message.Contains("target"))
            {
                Clients.All.broadcastMessage(message);
            }
            else
            {
                var cowMessage=JsonConvert.DeserializeObject<CowMessage>(message);
                Clients.Client(cowMessage.target).broadcastMessage(message);
            }
        }
    }
}