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

var mysql = require("mysql");


exports.database = function(settings)
{
  this.db = new mysql.Client();
  
  this.settings = settings;
  
  if(this.settings.host != null)
	this.db.host = this.settings.host;
	
  if(this.settings.port != null)
	this.db.port = this.settings.port;
	
  if(this.settings.user != null)
	this.db.user = this.settings.user;
  
  if(this.settings.password != null)
	this.db.password = this.settings.password;
	
  if(this.settings.database != null)
	this.db.database = this.settings.database;
  
  this.settings.cache = 1000;
  this.settings.writeInterval = 100;
  this.settings.json = true;
}

exports.database.prototype.init = function(callback)
{
	var self = this;

	this.isTablePresent(function(err,exists){
		//if this table doesn't exist, create it
		if (!err && !exists) {
			self.createTable(function(err){
				//@TODO: error handling
			})
		}
	});
}

exports.database.prototype.createTable = function(callback)
{
	var sqlCreate = "\
				CREATE TABLE IF NOT EXISTS `cache` ( \
					`pad_id` VARCHAR( 100 ) NOT NULL, \
					`content` LONGTEXT NOT NULL , \
 					`authors` varchar(255) DEFAULT '', \
  					`modified` datetime DEFAULT NULL, \
  					`revisions` bigint(11) DEFAULT '0', \
					PRIMARY KEY (  `pad_id` ) \
				) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci; \
				CREATE FULLTEXT INDEX idx ON cache(pad_id, content, authors); \
		";

	this.db.query(sqlCreate,[],function(err){
		if (callback)
			callback(err);
	});	
}

exports.database.prototype.isTablePresent = function(callback)
{
	var sqlCheck = "SHOW TABLES LIKE 'cache';";

	this.db.query(sqlCheck,[],function(err, results){
		callback(err,results.length > 0);
	});	
}

exports.database.prototype.get = function (id, callback)
{
  this.db.query("SELECT * FROM `cache` WHERE  `pad_id` = ?", [id], function(err,results)
  {
	var value = null;
	
	if(!err && results.length == 1)
	{
	  value = results[0].content;
	}
  
	callback(err,value);
  });
}

exports.database.prototype.search = function (search_term, callback, page, rows, key, order)
{
	//prepare search string

	var final_search_string = "";
	rows = parseInt(rows || 25);
	page = parseInt(page || 0);
	order = parseInt(order || 1);
	var offset = page * rows;

	if (key != 'pad_id' && key != 'modified' && key != 'revisions') {
		key = 'relevance';
		order = -1;
	}

	if (key == 'modified') {
		order = order * -1;
	}

	if (order == -1) {
		order = 'DESC';
	} else {
		order = 'ASC';
	}	

	if (search_term.indexOf('"') !== -1) {
		final_search_string = '+"' + search_term.replace('"', '') + '"';
	} else {
		var search = [];
		var terms = search_term.split(" ");
		for (var k in terms) {
			var term = terms[ k ];
			if (term.length > 1) {
				search.push("+" + term + "*");
			}
		}
		final_search_string = search.join(" ");		
	}

	this.db.query("\
		SELECT \
			cache.*, MATCH(pad_id, content, authors) AGAINST (? IN BOOLEAN MODE) AS relevance \
		FROM \
			`cache` \
		WHERE \
			MATCH(pad_id, content, authors) AGAINST (? IN BOOLEAN MODE) \
		ORDER BY \
			" + key + " " + order + " \
		LIMIT \
			" + offset + "," + rows + " \
	", [final_search_string, final_search_string], function(err,results)
	{
		var pads = [];

		if (err) {
			console.error(err);
		}

		if(!err && results.length > 0)
		{
			for (var k in results) {
				pads.push(results[k]);
			}
		}
		callback(err,pads);
	});
}

exports.database.prototype.list = function (callback, page, rows, key, order)
{
	rows = parseInt(rows || 25);
	page = parseInt(page || 0);
	order = parseInt(order || 1);
	var offset = page * rows;

	if (key != 'pad_id' && key != 'modified' && key != 'revisions') {
		key = 'pad_id';
	}

	if (key == 'modified') {
		order = order * -1;
	}

	if (order == -1) {
		order = 'DESC';
	} else {
		order = 'ASC';
	}

	this.db.query("SELECT * FROM `cache` ORDER BY " + key + " " + order + " LIMIT " + offset + "," + rows + ";", [], function(err,results)
	{
		var pads = [];
		if(!err && results.length > 0)
		{
			for (var k in results) {
				pads.push(results[k]);
			}
		} else {
			console.error(err);
		}
		callback(err,pads);
	});
}


exports.database.prototype.random = function (callback)
{
	this.db.query("SELECT * FROM cache WHERE RAND()<(SELECT ((1/COUNT(*))*10) FROM cache) ORDER BY RAND() LIMIT 1;", [], function(err,results)
	{
		if(!err && results.length > 0) {
			callback(err,results);
		} else {
			console.error(err);
		}		
	});
}

exports.database.prototype.set = function (id, content, authors, callback)
{
  if(id.length > 100)
  {
	callback("Your ID can only be 100 chars");
  }
  else
  {
	console.log("\n\n\n\nUPDATE DB!!!\n\n\n\n");
	this.db.query("INSERT INTO `cache` (pad_id, content, authors, modified) VALUES (?,?,?,NOW()) ON DUPLICATE KEY UPDATE revisions=revisions+1, content=?, authors=?, modified=NOW();", [id, content, authors, content, authors], function(err, info){
	  
	  console.log(err, info);

	  if (callback)
		callback(err);
	});
  }
}

exports.database.prototype.remove = function (id, callback)
{
  this.db.query("DELETE FROM `cache` WHERE `id` = ?", [id], callback);
}


exports.database.prototype.close = function(callback)
{
  this.db.end(callback);
}
