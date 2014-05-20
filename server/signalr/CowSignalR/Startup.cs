using System;
using System.Configuration;
using CowSignalR;
using Microsoft.AspNet.SignalR;
using Microsoft.Owin;
using Microsoft.Owin.Cors;
using Owin;

[assembly: OwinStartup(typeof(Startup))]
namespace CowSignalR
{
    public class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            app.UseFileServer(false);
            app.UseCors(CorsOptions.AllowAll);

            var projects = ConfigurationManager.AppSettings["projects"];
            foreach(var project in projects.Split(','))
            {
                var resolver= new DefaultDependencyResolver();
                app.MapSignalR(@"/" + project.Trim(), new HubConfiguration { EnableJSONP = true, EnableDetailedErrors = true, Resolver = resolver });
            };
           
            GlobalHost.Configuration.DisconnectTimeout = TimeSpan.FromSeconds(6);
        }
    }
}
