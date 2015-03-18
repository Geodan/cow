using System;
using System.Net.Http;
using Microsoft.AspNet.SignalR.Client;
using Microsoft.Owin.Hosting;
using NUnit.Framework;

namespace CowSignalR.Tests
{
    [TestFixture]
    public class Class1
    {

        [Test]
        public void FirstTest()
        {
            using (WebApp.Start<Startup>("http://localhost:12345"))
            {
                var httpclient = new HttpClient() { BaseAddress = new Uri("http://localhost:12345") };
                //var httpclient = new HttpClient() { BaseAddress = new Uri("http://wingis/cow/cowhub.html") };
                var response = httpclient.GetAsync("cowhub.html").Result.IsSuccessStatusCode;
                //var result = response.IsSuccessStatusCode; 
                //Assert.IsTrue(response);
            }
        }

        [Test]
        public void SecondTest()
        {
            using (WebApp.Start<Startup>("http://localhost:12345"))
            {
                var hubConnection = new HubConnection("http://localhost:12345");

                var _hub = hubConnection.CreateHubProxy("CowHub");

                // retrieve message

                _hub.On<string>("broadcastMessage", (message) => Assert.True(message=="bssert1"));

                hubConnection.Start().Wait();

                // sendmessage

                _hub.Invoke("SendAll", "bert");
            }


        }

    }
}
