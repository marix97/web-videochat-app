using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Web;
using ChatVideo.Helpers;
using ChatVideo.Models;
using Microsoft.AspNet.SignalR;

namespace ChatVideo
{
    public class ChatHub : Hub
    {
        private readonly static ConnectionMapping _connections =
            new ConnectionMapping();

        private readonly static Dictionary<string, List<string>> GroupsMapping =
            new Dictionary<string, List<string>>();

        private readonly static Dictionary<string, string> RoomsAndPasswords =
            new Dictionary<string, string>();

        IHubContext context = GlobalHost.ConnectionManager.GetHubContext<ChatHub>();

        public void Send(string message, string roomName = "lobby")
        {
            string name = Context.User.Identity.Name;

            if (message.StartsWith("/private"))
            {
                SendPrivate(name, message);
            }
            else
            {
                Clients.Group(roomName).addNewMessageToPage(name, message);
            }
        }

        public void SendPrivate(string name, string message)
        {
            try
            {
                // message format: /private(receiverName) Lorem ipsum...
                string[] split = message.Split(')');
                string receiver = split[0].Split('(')[1];

                if (_connections.ContainsKey(receiver))
                {
                    var userId = _connections.GetValueFromKey(receiver);

                    message = Regex.Replace(message, @"\/private\(.*?\)", string.Empty).Trim();

                    var contentToSend = Regex.Replace(message, @"(?i)<(?!img|a|/a|/img).*?>", String.Empty);
                    // Send the message
                    Clients.Client(userId).sendPrivateMessage(name, contentToSend);
                }
                else
                {
                    Clients.Caller.userIsOffline(receiver);
                }
            }
            catch (Exception)
            {
                Clients.Caller.onError();
            }
        }

        public override Task OnConnected()
        {
            string name = Context.User.Identity.Name;

            if (!_connections.ContainsKey(name))
               context.Clients.All.connected(name);
           
            _connections.Add(name, Context.ConnectionId);

            RoomModel room = new RoomModel { Name = "lobby", Password = string.Empty };

            if (GroupsMapping.ContainsKey(room.Name))
            {
                List<string> clientsInThisGroup = GroupsMapping[room.Name];
                clientsInThisGroup.Add(Context.ConnectionId);
            }
            else
            {
                var clientsInThisGroup = new List<string>();
                clientsInThisGroup.Add(Context.ConnectionId);
                GroupsMapping.Add(room.Name, clientsInThisGroup);
            }
            Clients.OthersInGroup(room.Name).userJoinedThisRoom(name);

            Groups.Add(Context.ConnectionId, room.Name);

            return base.OnConnected();
        }

        public override Task OnDisconnected(bool stopCalled)
        {
            string name = Context.User.Identity.Name;
            string currentRoom = string.Empty;

            if (stopCalled)
            {
                // disconnect user from all others groups he is in
                foreach (KeyValuePair<string, List<string>> groupMap in GroupsMapping)
                {
                    foreach (var user in groupMap.Value.ToList())
                    {
                        if (user == Context.ConnectionId)
                        {
                            groupMap.Value.Remove(user);
                            currentRoom = groupMap.Key;
                            Groups.Remove(Context.ConnectionId, groupMap.Key);
                        }
                    }
                }

                this.LeaveRoom(currentRoom, false);

                context.Clients.All.disconnected(name);

                _connections.Remove(name, Context.ConnectionId);
            }

            return base.OnDisconnected(stopCalled);
        }

        public Task CreateRoom(string roomName, string roomPassword)
        {
            bool sufficientRoomLength = true;

            roomName = roomName.Trim();

            if (roomName.Length < 5 || roomName.Length > 35)
            {
                Clients.Caller.roomLengthInvalid();
                sufficientRoomLength = false;
            }

            if (!GroupsMapping.ContainsKey(roomName) && sufficientRoomLength)
            {
                var clientsInThisGroup = new List<string>();
                GroupsMapping.Add(roomName, clientsInThisGroup);
                context.Clients.All.roomCreated(roomName);
                RoomsAndPasswords.Add(roomName, roomPassword);

                var currentRoom = string.Empty;
                foreach (KeyValuePair<string, List<string>> groupMap in GroupsMapping)
                {
                    foreach (var user in groupMap.Value.ToList())
                    {
                        if (user == Context.ConnectionId)
                        {
                            groupMap.Value.Remove(user);
                            currentRoom = groupMap.Key;
                            Groups.Remove(Context.ConnectionId, groupMap.Key);
                        }
                    }
                }

                this.LeaveRoom(currentRoom, true);
                this.JoinRoom(roomName, roomPassword);
            }

            return Task.CompletedTask;
        }

        public Task JoinRoom(string roomName, string roomPassword)
        {
            string previousRoom = string.Empty;

            if (RoomsAndPasswords.ContainsKey(roomName) && RoomsAndPasswords[roomName] != roomPassword)
            {
                return context.Clients.Client(Context.ConnectionId).wrongPassword();
            }

            string userWhoLeftPreviousRoom = string.Empty;
            string roomThatUserLeft = string.Empty;
            // disconnect user from all others groups he is in
            foreach (KeyValuePair<string, List<string>> groupMap in GroupsMapping)
            {
                foreach(var user in groupMap.Value.ToList())
                {
                    if (user == Context.ConnectionId)
                    {
                        groupMap.Value.Remove(user);
                        Groups.Remove(Context.ConnectionId, groupMap.Key);
                        previousRoom = groupMap.Key;
                        userWhoLeftPreviousRoom = _connections.GetKeyFromValue(Context.ConnectionId);
                        Clients.OthersInGroup(groupMap.Key).userLeftThisRoom(userWhoLeftPreviousRoom);
                    }
                }
            }


            if (GroupsMapping.ContainsKey(roomName))
            {
                List<string> clientsInThisGroup = GroupsMapping[roomName];
                clientsInThisGroup.Add(Context.ConnectionId);
                Clients.OthersInGroup(roomName).userJoinedThisRoom(userWhoLeftPreviousRoom);
                context.Clients.Client(Context.ConnectionId).updateActiveUsers(this.GetAllUsersInGroup(roomName));
                context.Clients.Client(Context.ConnectionId).successJoinRoom(roomName);
                if (previousRoom != roomName)
                {
                    LeaveRoom(previousRoom, false);
                }
                return Groups.Add(Context.ConnectionId, roomName);
            }

            return Task.CompletedTask;

        }

        public Task LeaveRoom(string roomName, bool shouldShowLeaveMessage = true)
        {
            if (GroupsMapping.ContainsKey(roomName))
            {
                var clientsInThisGroup = GroupsMapping[roomName];
                clientsInThisGroup.Remove(Context.ConnectionId);
                if (shouldShowLeaveMessage)
                    Clients.OthersInGroup(roomName).userLeftThisRoom(_connections.GetKeyFromValue(Context.ConnectionId));

                if (clientsInThisGroup.Count == 0 && !roomName.Equals("lobby"))
                {
                    GroupsMapping.Remove(roomName);
                    context.Clients.All.roomDestroyed(roomName);
                    RoomsAndPasswords.Remove(roomName);
                    return Groups.Remove(Context.ConnectionId, roomName);
                }
            }

            return Task.CompletedTask;
        }

       

        public List<string> GetAllGroupsNames()
        {
            var groupNames = new List<string>();
            foreach (KeyValuePair<string, List<string>> entry in GroupsMapping)
            {
                groupNames.Add(entry.Key);
            }
            return groupNames;
        }

        public List<string> GetAllUsersInGroup(string roomName)
        {
            var groupConnections = new List<string>();

            foreach (string groupConnection in GroupsMapping[roomName])
            {
                foreach (KeyValuePair<string, string> entry in _connections.GetAllConnections())
                {
                    if (entry.Value == groupConnection)
                    {
                        groupConnections.Add(entry.Key);
                    }
                }
            }
            return groupConnections;
        }

        public List<string> GetAllActiveConnections()
        {
            return _connections.GetAllKeys();
        }

        public static string GetConnectionIdByName(string name)
        {
            return _connections.GetValueFromKey(name);
        }

        public static void RemoveConnectionByName(string name)
        {
            if(name != null)
               _connections.Remove(name, null);
        }
    }
}
