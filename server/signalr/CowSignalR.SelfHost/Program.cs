using System;
using CommandLine;
using Microsoft.Owin.Hosting;

namespace CowSignalR.SelfHost
{
    class Program
    {
        private const string Url = "http://localhost:{0}";

        static void Main(string[] args)
        {
            Console.WriteLine("Cow server");

            var options = new Options();

            if (Parser.Default.ParseArguments(args, options))
            {
                var startUrl=String.Format(Url,options.Port);
                using (WebApp.Start<Startup>(startUrl))
                {
                    Console.WriteLine("started on {0}", startUrl);
                    Console.Write("press any key to stop...");
                    Console.ReadLine();
                }
            }
        }
    }
}
