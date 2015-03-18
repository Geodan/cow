using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNet.SignalR.Client;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using Newtonsoft.Json.Linq;

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
        public event Action<List<Record>>  UsersResponse;
        public event Action<List<Record>> ProjectsResponse;
        public event Action<List<Record>> PeersResponse;
        public event Action<List<Record>> GroupsResponse;
        public event Action<List<Record>> ItemsResponse;

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

                var json = JsonConvert.DeserializeObject<dynamic>(message);
                // todo: use var action = (EnumAction) json.action;
                var payload = json.payload;
                var listArray = (JArray)payload.list;
                if (listArray!=null && listArray.Count > 0)
                {
                    var records = listArray.ToObject<List<Record>>();
                    var notDeletedRecords = (from p in records where p.deleted == false select p).ToList();

                    var syncType = (string)payload["syncType"];
                    switch (syncType)
                    {
                        case "users":
                            if(UsersResponse!=null) UsersResponse(notDeletedRecords);
                            break;
                        case "projects":
                            if(ProjectsResponse!=null) ProjectsResponse(notDeletedRecords);
                            break;
                        case "peers":
                            if(PeersResponse!=null) PeersResponse(notDeletedRecords);
                            break;
                        case "items":
                            if(ItemsResponse!=null) ItemsResponse(notDeletedRecords);
                            break;
                        case "groups":
                            if(GroupsResponse!=null) GroupsResponse(notDeletedRecords);
                            break;
                    }
                }

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

        public void SendItemType(EnumItemType type,string projectid=null)
        {
            var payload = new Payload(type, new List<string>(),projectid);
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
