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

Superpeer global configuration
----------------------------------------
1. Directories, Superpeer sources in /opt

```
	mkdir -p /opt/cow/log
	chmod 777 /opt/cow/log
```

2. Install requirements

`apt-get install -y nodejs npm git`

In Debian bases desitros node is already reserved for something else than nodejs. To make installing npm modules easier create a symlink:
`cd /usr/bin && ln -s node nodejs`

3. Clone cow software from GitHUb

`cd /opt/cow && git clone https://github.com/Geodan/cow`
	
4. Extra node modules:

Needed node modules, install with npm in the cow direcory:
```
	cd /opt/cow/cow 
	npm install underscore es6-promise websocket pg pg-native
	npm install forever -g
```

5. Installation of Postgis is not described here

Note that the user 'cow' must be able to access the database.  Dee file pg_hba.conf

6. Database cow

Run in PostGIS:

```
	create role cow login with createdb createrole password 'cow';

	create database cow with owner =  cow;
	grant all on database cow to cow;

	create extension postgis;
```

Superpeer creates it's own schema and schema-objects upon first run.

7. Create a configuration. When running multiple Superpeers, multiple config files must be created

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

Run Superpeer with forever as a global service
----------------------------------------
1. If not previously done, install forever package

```
	npm install forever -g
```

2. Create a global init.d script (change paths as needed and uid for different clients/processes)

```
	sudo su
	vim /etc/init.d/sp-ontw
```
Check the sample init.d script and adjust code as needed

Make the script executable

```	
	chmod +x /etc/init.d/sp-ontw
```

Add script to rc.d, if you want to enable it on boot

```	
	update-rc.d sp-ontw defaults
```