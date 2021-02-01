using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ChatVideo.Helpers
{
   public class ConnectionMapping
    {
        private readonly Dictionary<string, string> _connections =
            new Dictionary<string, string>();

        public Dictionary<string, string> GetAllConnections()
        {
            return _connections;
        }

        public int Count
        {
            get
            {
                return _connections.Count;
            }
        }

        public void Add(string key, string connectionId)
        {

            if (_connections.ContainsKey(key))
                _connections[key] = connectionId;
            else
                _connections.Add(key, connectionId);
        }

        public string GetValueFromKey(string key)
        {
                return this._connections[key];
        }

        public string GetConnections(string key)
        {
            if (_connections.ContainsKey(key))
                return _connections[key];
            return string.Empty;
        }

        public void Remove(string key, string connectionId)
        {
            if (_connections.ContainsKey(key))
                _connections.Remove(key);
        }

        public List<string> GetAllKeys()
        {
            List<string> names = new List<string>();
            foreach (KeyValuePair<string, string> entry in _connections)
            {
                names.Add(entry.Key);
                // do something with entry.Value or entry.Key
            }
            return names;
        }

        public string GetKeyFromValue(string value)
        {
            foreach (KeyValuePair<string, string> entry in _connections)
            {
                if (entry.Value == value)
                    return entry.Key;
            }
            return string.Empty;
        }

        public bool ContainsKey(string key)
        {
            return this.GetAllKeys().Contains(key);
        }
    }
}