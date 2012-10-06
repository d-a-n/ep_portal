
var eejs = require("ep_etherpad-lite/node/eejs");
var cacheRepository = new require("./db/cacheRepository");
var cache = new cacheRepository.cache();

/*
 * Setup the cache
 */
exports.initBackend = function (hook_name, args, cb)
{
	cache.init();

	//overwrite default route
	args.app.remove('/');
	args.app.all('/', function(req, res) {
		res.redirect('/pad/Welcome');
	});

	args.app.get('/pad/:id', function(req, res) {
		res.render(__dirname + "/templates/views/viewPad.ejs", { locals: { 'pad_id': req.params.id } } );
	});

	args.app.get('/list', function(req, res) {
		res.render(__dirname + "/templates/views/list.ejs", {} );
	});

	args.app.get('/random', function(req, res) {
		cache.random(function(err, pad){

			if (!err && pad) {
				res.redirect('/pad/' + pad.pad_id);
			} else {
				res.redirect('/list');
			}			
		});
	});

	/**
	 * API CALLS
	 */
	args.app.get('/api.json/search*', function(req, res) {
		cache.search(req.query["query"], function(err, results) {
			if (err || !results) {
				results = [];
			}
			res.contentType('application/json');
			res.send(results);
		}, req.query["page"], req.query["rows"], req.query["key"], req.query["order"]);
	});

	args.app.get('/api.json/list*', function(req, res) {
		cache.list(function(err, results) {
			if (err || !results) {
				results = [];
			}
			res.contentType('application/json');
			res.send(results);
		}, req.query["page"], req.query["rows"], req.query["key"], req.query["order"]);
	});
}

/*
exports.eejsBlock_body = function (hook_name, args, cb) {

	console.log("\n\n\ndebug debug debug\n\n");

	args.content = eejs.require("ep_portal/templates/searchBar.ejs", {}, module) + args.content;
	return cb();
}
*/

/*
exports.eejsBlock_styles = function (hook_name, args, cb) {
	args.content = args.content + eejs.require("ep_portal/templates/searchBarStyles.ejs", {}, module);
	return cb();
}*/

/**
 * Update cache is pads get changed
 */ 
exports.update = function(hook, pad){
	cache.update(pad);
}
