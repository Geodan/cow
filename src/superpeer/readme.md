
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

Install Superpeer running in supervisord
----------------------------------------

This describes installing superpeer to be run from supervisord. (http://supervisord.org/)
And uses a local postgres database

1. Directories, Superpeer sources in /opt

```
	mkdir -p /opt/cow/log
	chmod 777 /opt/cow/log
```

2. Install requirements

	`apt-get install -y supervisor nodejs npm git`

In Debian bases desitros node is already reserved for something else than nodejs. To make installing npm modules easier create a symlink:
`cd /usr/bin && ln -s node nodejs`


4. Clone cow software from GitHUb

`cd /opt/cow && git clone https://github.com/Geodan/cow`
	
3. Extra node modules:

Needed node modules, install with npm in the cow direcory:
```
cd /opt/cow/cow 
npm install underscore
npm install es6-promise
npm install websocket
npm install pg
npm install pg-native
```
4. Installation of Postgis is not described here

Note that the user 'cow' must be able to access the database.  Dee file pg_hba.conf

5. Database cow

Run in PostGIS:

```
create role cow login with createdb createrole password 'cow';

create database cow with owner =  cow;
grant all on database cow to cow;

create extension postgis;
```

Superpeer creates it's own schema and schema-objects upon first run.

5. Create a configuration. When running multiple Superpeers, multiple config files must be created

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

The superpeer can be started with
```
node superpeer.js config.json
```
Tbd: Supervisor config:
