using System.Text;
using CommandLine;

namespace CowSignalR.SelfHost
{
    class Options
    {
        [Option('p', "port", DefaultValue = 8089, HelpText = "the port to run on")]
        public int Port { get; set; }

        [HelpOption]
        public string GetUsage()
        {
            var usage = new StringBuilder();
            usage.AppendLine("");
            usage.AppendLine("Usage: CowServer [-p port]");
            usage.AppendLine("Options: -p, --port       the tcp port to listen on. Default is 8089.");
            usage.AppendLine("Sample: CowServer -p 5000");
            return usage.ToString();
        }
    }
}
