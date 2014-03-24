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
    public partial class LoginForm : Form
    {
        private List<Record> _users; 
        public LoginForm(List<Record> users)
        {
            InitializeComponent();
            _users = users;
            Init();
        
        
        }

        public void Init()
        {
            
            
        }




        private void LoginForm_Load(object sender, EventArgs e)
        {

        }
    }
}
