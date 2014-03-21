
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using NUnit.Framework;


namespace Cow.Client.Core.Tests
{
    public class Class1
    {
        [Test]
        public void Test()
        {
            using (var r = new StreamReader("CowProjectsSample.json"))
            {
                var json = r.ReadToEnd();
                dynamic d = JObject.Parse(json);
                var payload = d.payload;
                var syncType = (string)payload["syncType"];
                Assert.AreEqual("projects",syncType);

                var projects = payload.list;
                Assert.AreEqual("projects", syncType);
                Assert.AreEqual(2, Enumerable.Count(projects));
                var first = (string)projects[0]._id;
                Assert.AreEqual("laagerwater", first);
                //var s = from p in projects select p;

                var p = new List<Project>();
                foreach (var result in projects)
                {
                    p.Add(new Project(){});
                }



                int[] numbers = { 5, 4, 1, 3, 9, 8, 6, 7, 2, 0 };

                var lowNums =
                    from n in numbers
                    where n < 5
                    select n; 
      
            }


        }
    }
}
