using Microsoft.AspNet.SignalR;
using Microsoft.Owin;
using Owin;
using System;
using System.Web.Routing;

[assembly: OwinStartupAttribute(typeof(ChatVideo.Startup))]
[assembly: OwinStartup(typeof(ChatVideo.Startup))]

namespace ChatVideo
{
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            ConfigureAuth(app);

            app.MapSignalR();
        }
    }
}
