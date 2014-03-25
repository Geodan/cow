using System;
using System.Collections.Generic;
using System.Windows.Forms;

namespace Cow.Client.WinForms
{
    public partial class CowForm : Form
    {
        private const string Url = "http://wingis/cow/signalr";
        private CowHub _hub;
        private Record _userRecord;

        public CowForm()
        {
            InitializeComponent();
            Init();
        }

        public async void Init()
        {
            // first get users...
            _hub = new CowHub(Url);
            _hub.UsersResponse += _hub_UsersResponse;
            await _hub.Connect();
            //var clientId =  _hub.ClientId;

            _hub.SendItemType(EnumItemType.users);
        }

        public void _hub_UsersResponse(List<Record> users)
        {
            var loginForm = new LoginForm(users);
            Invoke(new MethodInvoker(delegate
            {
                loginForm.Init();
                var result= loginForm.ShowDialog(this);
                if (result == DialogResult.OK)
                {
                    _userRecord = loginForm.SelectedRecord;
                    lblUser.Text = _userRecord._id;
                }
            }));
        }

        private void CowForm_Load(object sender, EventArgs e)
        {

        }

        private void btnDebug_Click(object sender, EventArgs e)
        {
            var mainForm = new MainForm();
            mainForm.ShowDialog();

        }
    }
}
