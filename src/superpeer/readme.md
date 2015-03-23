Install
-------
tbd


Running direct
---------------
Run a new superpeer with:
```
node superpeer.js config.json
```

Config file should look like:
```
{
	"dbUrl": "tcp://user:pass@ip/db",
	"herdname":"blabla",
	"protocol": "wss",
	"ip": "ip.to.socketserver",
	"port": 443,
	"dir": "blabla"
}   
```

Running in supervisord
----------------------
