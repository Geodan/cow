using System;
using System.Globalization;
using System.Linq;
using System.Windows.Forms;
using Microsoft.AspNet.SignalR.Client;

namespace Cow.Client.WinForms
{
    public partial class MainForm : Form
    {
        delegate void SetTextCallback(string text);
        private int _messagesCounter;
        private CowHub _hub;

        public MainForm()
        {
            InitializeComponent();
        }

        private void AddLog(string message)
        {
            if (tbMessages.InvokeRequired)
            {
                var d = new SetTextCallback(AddLog);
                Invoke(d, new object[] { message });
            }
            else
            {
                _messagesCounter++;
                lblMessagesCounter.Text = _messagesCounter.ToString(CultureInfo.InvariantCulture);
                tbMessages.AppendText(string.Format("{0}: {1}{2}", DateTime.Now.ToUniversalTime(), message, Environment.NewLine+Environment.NewLine));
            }
        }


        private async void btnConnect_Click(object sender, EventArgs e)
        {
            var url = tbUrl.Text;

            _hub = new CowHub(url);
            _hub.StateChanged += StateChanged;
            _hub.BroadcastMessage += BroadcastMessage;
            _hub.UserConnected += UserConnected;
            _hub.UserReconnected += UserReconnected;
            _hub.UserDisconnected += UserDisconnected;
            _hub.UsersResponse += _hub_UsersResponse;
            _hub.ProjectsResponse+=_hub_ProjectsResponse;
            _hub.PeersResponse += _hub_PeersResponse;
            _hub.GroupsResponse += _hub_GroupsResponse;
            _hub.ItemsResponse += _hub_ItemsResponse;

            await _hub.Connect();
            AddLog("SignalR connected");
            AddLog("SignalR connection id:" + _hub.ClientId);
            AddLog("SignalR transport mode:" + _hub.TransportName);
        }

        void _hub_UsersResponse(System.Collections.Generic.List<Record> users)
        {
            AddLog(string.Format("Users: {0}", string.Join(", ", users.Select(w => w._id))));
        }

        void _hub_ProjectsResponse(System.Collections.Generic.List<Record> projects)
        {
            AddLog(string.Format("Projects: {0}", string.Join(", ", projects.Select(w => w._id))));
        }

        void _hub_PeersResponse(System.Collections.Generic.List<Record> peers)
        {
            AddLog(string.Format("Peers: {0}", string.Join(", ", peers.Select(w => w._id))));
        }

        void _hub_GroupsResponse(System.Collections.Generic.List<Record> groups)
        {
            AddLog(string.Format("Groups: {0}", string.Join(", ", groups.Select(w => w._id))));
        }

        void _hub_ItemsResponse(System.Collections.Generic.List<Record> items)
        {
            AddLog(string.Format("Items: {0}", string.Join(", ", items.Select(w => w._id))));
        }

        void UserReconnected(string connectionId)
        {
            AddLog(string.Format("User reconnected: {0}", connectionId));
        }
        void UserDisconnected(string connectionId)
        {
            AddLog(string.Format("User disconnected: {0}", connectionId));
        }

        void UserConnected(string connectionId)
        {
            AddLog(string.Format("User connected: {0}", connectionId));
        }

        void BroadcastMessage(string message)
        {
            AddLog(message);
        }

        void StateChanged(StateChange obj)
        {
            AddLog("SignalR state changed from: " + obj.OldState + " to: " + obj.NewState);
        }


        private void btnSyncUsers_Click(object sender, EventArgs e)
        {
            _hub.SendItemType(EnumItemType.users);
        }

        private void btnPeers_Click(object sender, EventArgs e)
        {
            _hub.SendItemType(EnumItemType.peers);
        }

        private void btnProjects_Click(object sender, EventArgs e)
        {
            _hub.SendItemType(EnumItemType.projects);
        }

        private void groups_Click(object sender, EventArgs e)
        {
            _hub.SendItemType(EnumItemType.groups,"boe");
        }

        private void items_Click(object sender, EventArgs e)
        {
            _hub.SendItemType(EnumItemType.items,"boe");
        }

        private void button1_Click(object sender, EventArgs e)
        {
            var chatForm = new CowForm();
            chatForm.ShowDialog(this);
        }

        private void MainForm_Load(object sender, EventArgs e)
        {

        }
    }
}
