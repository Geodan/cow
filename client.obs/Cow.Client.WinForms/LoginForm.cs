using System;
using System.Collections.Generic;
using System.Windows.Forms;

namespace Cow.Client.WinForms
{
    public partial class LoginForm : Form
    {
        private List<Record> _users;
        public Record SelectedRecord { get; set; }
        public LoginForm(List<Record> users)
        {
            InitializeComponent();
            _users = users;
        }

        public void Init()
        {
            lbLogin.Items.Clear();
            lbLogin.DataSource = _users;
            lbLogin.DisplayMember = "_id";
        }

        private void LoginForm_Load(object sender, EventArgs e)
        {
        }

        private void lbLogin_SelectedIndexChanged(object sender, EventArgs e)
        {

        }

        private void btnSelect_Click(object sender, EventArgs e)
        {
            SelectedRecord = (Record)lbLogin.SelectedItem;
            DialogResult = DialogResult.OK;
        }

        private void btnCancel_Click(object sender, EventArgs e)
        {
            DialogResult = DialogResult.Cancel;
        }
    }
}
