using System.Threading.Tasks;
using Microsoft.AspNet.SignalR;

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

        public void SendToTarget(string target, string message)
        {
            Clients.Client(target).broadcastMessage(message);
        }

        public void SendToAll(string message)
        {
            Clients.All.broadcastMessage(message);
        }
    }
}