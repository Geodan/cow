using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace Cow.Client.WinForms
{
    public partial class CowForm : Form
    {
        private string url = "http://wingis/cow/signalr";
        private CowHub _hub;

        public CowForm()
        {
            InitializeComponent();
            init();
        }

        public async void init()
        {
            // first get users...
            _hub = new CowHub(url);
            _hub.UsersResponse += _hub_UsersResponse;
            await _hub.Connect();
            var clientId =  _hub.ClientId;

            _hub.SendItemType(EnumItemType.users);
        }

        static void _hub_UsersResponse(List<Record> users)
        {
            var loginForm = new LoginForm(users);
            loginForm.ShowDialog();
            // AddLog(string.Format("Users: {0}", string.Join(", ", users.Select(w => w._id))));
        }

        private void CowForm_Load(object sender, EventArgs e)
        {

        }
    }
}
