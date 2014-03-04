using System;
using System.Threading.Tasks;
using CowSignalR.Models;
using Microsoft.AspNet.SignalR;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

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
            dynamic d = JObject.Parse(message);
            string target = d.target;
            if(String.IsNullOrEmpty(target)){
                Clients.All.broadcastMessage(message);
            }
            else
            {
                Clients.Client(target).broadcastMessage(message);
            }
        }
    }
}