using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ChatVideo.Models
{
    public class RoomModel
    {
        public string Name { get; set; }
        public string Password { get; set; }

        public bool Equals(RoomModel room)
        {
            return room.Name.Equals(Name) && room.Password.Equals(Password);
        }

        public override bool Equals(object obj)
        {
            return this.Equals(obj as RoomModel);
        }

        public override int GetHashCode()
        {
            return Name.GetHashCode() ^ Password.GetHashCode();
        }
    }
}