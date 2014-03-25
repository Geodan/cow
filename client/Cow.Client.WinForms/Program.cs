using System;
using System.Windows.Forms;

namespace Cow.Client.WinForms
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new CowForm());
        }
    }
}
