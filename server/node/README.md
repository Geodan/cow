Running direct
---------------
Run cash with:
```
	node cash.js
```

Run CASH with forever as a global service
----------------------------------------
1. If not previously done, install forever package

```
	npm install forever -g
```

2. Create a global init.d script (change paths as needed and uid for different clients/processes)

```
	sudo su
	vim /etc/init.d/cash-ontw
```
Check the sample init.d script and adjust code as needed

Make the script executable

```	
	chmod +x /etc/init.d/cash-ontw
```

Add script to rc.d, if you want to enable it on boot

```	
	update-rc.d cash-ontw defaults
```