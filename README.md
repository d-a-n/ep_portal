#ep_portal

This Etherpad Lite plugin will provide a full featured portal.

##Screenshot
![image](https://raw.github.com/d-a-n/ep_portal/assets/images/screenshot.png)

##Features:

- full text search ✓
- list all pads (with infinite scrolling) ✓
- sort by title and date ✓
- build with Bootstrap/Less for easy customization ✓
- group pads [TBD]
- user authentication [TBD]
- one-click install via EPL backend [TBD]

##Roadmap
###1.0
- User authentication (Password, oAuth, OpenID, Github, Facebook, Twitter, …)
- Permission management (full access, read only, login only ,…)
- Pad administration (create, delete)a
- Group pads
- Support for MySQL, PostgreSQL, MongoDB, ...

###2.0
- Search autocomplete and suggestions

Any features missing? Please tell me.

###Things for evaluation
- Natural Language Search


##Setup

**Note:** At this time ep_portal **only supports *MySQL*.** If you are running EPL on *node-dirty* ep_portal won't work. Database support for *mongodb* and *PostgreSQL* will be available soon.

*Be aware that the plugin needs some EPL hooks that are not available in the master branch yet. Please use the EPL development branch until those new hooks will be merged.*

###Install

	cd /your/etherpad lite/dir/available_plugins/
	git clone https://github.com/d-a-n/ep_portal.git 
	cd ..
	npm install available_plugins/ep_portal/
	



[![Flattr this git repo](http://api.flattr.com/button/flattr-badge-large.png)](https://flattr.com/submit/auto?user_id=dans&url=https://github.com/d-a-n/ep_portal&title=ep_portal&language=&tags=github&category=software) 
	