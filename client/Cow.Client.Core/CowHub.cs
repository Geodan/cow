using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNet.SignalR.Client;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace Cow.Client
{
    public class CowHub
    {
        private readonly string _url;
        private HubConnection _connection;
        private Guid _clientGuid;
        private IHubProxy _proxy;
        public event Action<StateChange> StateChanged;
        public event Action<String> UserConnected;
        public event Action<String> UserDisconnected;
        public event Action<String> UserReconnected;
        public event Action<String> BroadcastMessage;

        public CowHub(string url)
        {
            if (url == null) throw new ArgumentNullException("url");
            _url = url;
        }

        public async Task<Guid> Connect()
        {
            _connection = new HubConnection(_url);
            _proxy = _connection.CreateHubProxy("CowHub");
            _connection.StateChanged += StateChanged;

            _proxy.On("broadcastMessage", (string message) =>
            {
                if (BroadcastMessage != null)
                    BroadcastMessage(message);
            });
            _proxy.On("userConnected", (string connectionId) =>
            {
                if (UserConnected != null)
                    UserConnected(connectionId);
            });
            _proxy.On("userDisconnected", (string connectionId) =>
            {
                if (UserDisconnected != null)
                    UserDisconnected(connectionId);
            });
            _proxy.On("userReconnected", (string connectionId) =>
            {
                if (UserReconnected != null)
                    UserReconnected(connectionId);
            });

            await _connection.Start();
            _clientGuid = new Guid(_connection.ConnectionId);
            return _clientGuid;
        }

        public void SendItemType(EnumItemType type)
        {
            var payload = new Payload(type, new List<string>());
            var cowMessage = new CowMessage(EnumAction.newList,_clientGuid, payload);
            Send(cowMessage);
        }

        private void Send(CowMessage cowMessage)
        {
            var cowStringEnumConvertor = new StringEnumConverter { CamelCaseText = false };
            var jsonSerializerSettings = new JsonSerializerSettings
            {
                Formatting = Formatting.None,
                NullValueHandling = NullValueHandling.Ignore
            };
            jsonSerializerSettings.Converters.Add(cowStringEnumConvertor);
            var message = JsonConvert.SerializeObject(cowMessage, jsonSerializerSettings);

            _proxy.Invoke("Send", message);
        }


        public Guid ClientId
        {
            get { return _clientGuid; }
        }

        public string TransportName
        {
            get
            {
                return _connection.Transport.Name;
            }
        }
    }
}
