/**
 * 2012 Daniel Korger
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var settings = require("../../../src/node/utils/Settings");
var authorManager = require('../../../src/node/db/AuthorManager');
var dbAdapter = require("./mysqlAdapter"); // currently there is mysql support only


exports.cache = function() {
	//@TODO: those values need to be placed in a settings file
	this.config = {
		'inactivity_timeout': 10, //in seconds
		'force_update_timeout': 300 //in seconds
	};
	this.padCacheStates = {};
	this.db = new dbAdapter.database(settings.dbSettings);
}

exports.cache.prototype.init = function() {

	this.db.init(function(err){
		if (err) {
			//@TODO: error handling
		}
	});
}

/**
 * Update the cache after one minute of inactivity but at least after 5 minutes
 */
exports.cache.prototype.update = function(pad) {

	var cacheState = {
		callback:null,
		timestamp:null
	},
		now = Math.round(+new Date()/1000)
		self = this;

	if (!this.padCacheStates[ pad.id ]) {
		this.padCacheStates[ pad.id ] = cacheState;
	}

	var padState = this.padCacheStates[ pad.id ];

	if (padState['callback']) {
		clearTimeout(padState['callback']);
	} else {
		padState['timestamp'] = now;
	}

	if (padState['timestamp'] && (now - padState['timestamp']) > this.config['force_update_timeout']) {
		self.updatePad(pad);		
		padState['timestamp'] = now;
	}

	padState['callback'] = setTimeout(function() {
		self.updatePad(pad);
		padState['timestamp'] = now;
	}, this.config['inactivity_timeout'] * 1000);
}

exports.cache.prototype.updatePad = function(data) {
	if (!data || !data.pad) {
		return;
	}
	var pad = data.pad;
	
	var authors = data.pad.getAllAuthors(),
		authorNames = [],
		self = this;

	function getAuthorNames(i) {
		if( i < authors.length ) {
			authorManager.getAuthorName(authors[i], function(err, name) {
				authorNames.push({'id':authors[i], 'name': name});
				getAuthorNames(i+1);
			});
		} else {
			self.db.set(pad.id, pad.atext.text, JSON.stringify(authorNames));
		}
	}
	getAuthorNames(0);
}

exports.cache.prototype.prepareForOutput = function(data) {
	for (var k in data) {
		var content = data[ k ].content;
		content = content.substr(0,100)+(content.length>100?'...':'');
		data[ k ].content = content;
		data[ k ].authors = JSON.parse(data[ k ].authors);
	}
	return data;	
}

exports.cache.prototype.search = function(search_term, callback, page, rows, key, order) {
	var self = this;
	this.db.search(search_term,function(err, results) {
		callback(err, self.prepareForOutput(results));
	}, page, rows, key, order);
}

exports.cache.prototype.list = function(callback, page, rows, key, order) {
	var self = this;
	this.db.list(function(err, results) {
		callback(err, self.prepareForOutput(results));
	}, page, rows, key, order);
}

exports.cache.prototype.random = function(callback) {
	var self = this;
	this.db.random(function(err, results) {
		if (results.length > 0) {
			callback(err, self.prepareForOutput(results)[0] );
		}
	});
}