####Messaging Protocol

COW uses a message protocol to send over its data. A message is a JSON object with at least an _action_ and a _payload_ and possibly a _target_. There are two main sets of messages. The first are used to keep track who is who on the websocket (network topology). These are low level messages and shouldn't be messed with. The second are higher level ones that handle the syncing of data in cow.

There are two types of messages: targeted and broadcast. The first is meant for a specific peer, the second for everybody.

**websocket**

*connected* (targeted)

This message is send by the websocket server to the peer once a connection has been established between de server and the peer. It contains the PEERID, the unique ID to keep track of the client. It will change after reconnect. This is a read only message sent by the server and never by a client.

```
{"action":"connected","payload":{"peerID":1410519905412,"server_ip":"192.168.24.151","server_key":"cow","server_version":"0.1"}} 
{
    action : "connected",
    payload : {
        peerID: ID,
        server_ip: IP,
        server_key: KEY,
        server_version: VERSION
     }
}
```

*peerGone* (targeted)

This message is send by the websocket server to peers once a connection is lost between another peer and the server. It contains the LOSTPEERID; the PEERID of peer that has left. This is a read only message sent by the server and never by a client.

```
{
    "action" : "peerGone",
    "payload": { 
        "gonePeerID" : LOSTPEERID
    }
}
```

*command* (optional targeted)

Peers can be given commands. Some core commands are processed directly by core (see below) but most will trigger an event that can be hooked on by the client as: 
```websocket().on(<command>,function(data){ //do something })```

```
{
    "action" : "command",
    "sender" : PEERID,
    "target" : TARGETPEERID, //optional
    "payload": { 
        "command" : WHATEVER
        "more"  : OPTIONALDATA
        "params" : MOREDATA
    }
}
```

**syncing**

*newList*

When you want to sync (ie after connecting) you sent a 'newlist' with the ids, timestamp and status of each record

```
{
    "action" : "newList",
    "sender" : PEERID,
    "payload" : {
        "syncType" : ITEMTYPE, //One of 'peers','users', 'projects', 'items', 'groups','socketservers'
        "list" : MYLIST,
        "project": PROJECTID //optional, only for items and groups 
    }
}
```

*syncinfo*

The alphapeer will sent you information on what is going to sync

```
{
    "action" : "syncinfo",
    "sender" : PEERID,
    "payload" : {
        "syncType" : ITEMTYPE, //One of 'peers','users', 'projects', 'items', 'groups'
        "syncinfo" : {
            "IWillSent": IDLIST,
            "IShallReceive": IDLIST
        },
        "project": PROJECTID //optional
    }
}
```

*wantedList*

The alphapeer sents a list of record ids that it wants you to broadcast
```
{
    "action" : "wantedList",
    "sender" : PEERID,
    "target" : TARGETPEERID,
    "payload" : {
        "syncType" : ITEMTYPE,
        "list" : YOURLIST,
        "project": PROJECTID //optional
    }
}
```

*missingItems*

The alphapeer sents a list of records that you are missing. Add them to your store.
```
{
    "action" : "missingItems",
    "sender" : PEERID,
    "target" : TARGETPEERID,
    "payload" : {
        "syncType" : ITEMTYPE,
        "items" : [{}],
        "project": PROJECTID //optional
    }
}
```

*updatedRecord*

A new or updated record is broadcasted. Add it to your store.
```
{
    "action" : "updatedRecord",
    "sender" : PEERID,
    "payload" : {
        "syncType" : ITEMTYPE,
        "record : {},
        "project": PROJECTID //optional
    }
}
```
