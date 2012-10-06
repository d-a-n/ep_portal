#ep_portal

This Etherpad Lite plugin will provide a full featured portal.

##Screenshot
![image](https://raw.github.com/d-a-n/ep_portal/assets/images/screenshot.png)

##Features:

- full text search
- list all pads
- sort by title and date
- group pads [TBD]
- user authentication [TBD]
- one-click install via EPL backend [TBD]

##Setup

**Note:** At this time ep_portal only supports *MySQL*. If you are running EPL on *node-dirty* ep_portal won't work. Database support for *mongodb* and *PostgreSQL* will be available soon.

*Be aware that the plugin needs some EPL hooks that are not available in the master branch yet. Please use the EPL development branch until those new hooks will be merged.*

###Install

	cd /your/etherpad lite/dir
	git clone https://github.com/d-a-n/ep_portal.git available_plugins/
	npm install available_plugins/ep_portal/
	