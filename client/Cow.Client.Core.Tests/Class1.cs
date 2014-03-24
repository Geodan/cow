
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using NUnit.Framework;

namespace Cow.Client.Core.Tests
{
    public class Class1
    {
        [Test]
        public void TestUsers()
        {
            using (var r = new StreamReader("CowUsersSample.json"))
            {
                var jsonstring = r.ReadToEnd();
                var json = JsonConvert.DeserializeObject<dynamic>(jsonstring);
                var payload = json.payload;
                var syncType = (string)payload["syncType"];
                Assert.AreEqual("users", syncType);
                var userrecordsJArray = (JArray)payload.list;
                var users = userrecordsJArray.ToObject<List<Record>>();

                Assert.AreEqual("users", syncType);
                Assert.AreEqual(2,users.Count);
                var user1=users[0]._id;
                Assert.AreEqual("1", user1);

                // select not deleted users
                var activeusers = from p in users where p.deleted==false select p;
                Assert.AreEqual(1, activeusers.Count());
            }
        }

        [Test]
        public void TestProjects()
        {
            using (var r = new StreamReader("CowProjectsSample.json"))
            {
                var json = r.ReadToEnd();
                dynamic d = JObject.Parse(json);
                var payload = d.payload;
                var syncType = (string)payload["syncType"];
                Assert.AreEqual("projects",syncType);

                Assert.AreEqual("projects", syncType);
                var userrecordsJArray = (JArray)payload.list;
                var projects = userrecordsJArray.ToObject<List<Record>>();
                Assert.AreEqual(2,projects.Count);
            }
        }
    }
}
