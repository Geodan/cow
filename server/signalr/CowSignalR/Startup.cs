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
            app.MapSignalR(new HubConfiguration{EnableJSONP = true,EnableDetailedErrors = true});
        }
    }
}
