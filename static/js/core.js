(function(){
	/**
	 * Config
	 */
	 var Config = {
		 search_timeout: 600, //timeout in ms
		 rows_per_page: 25,
		 pad_min_height: 300
	 }
	
	/**
	 * Helper
	 */
	 var delay = (function(){
		 var timer = 0;
		 return function(callback, ms){
			 clearTimeout (timer);
			 timer = setTimeout(callback, ms);
		 };
	 })();

	 String.prototype.padId2Title = function() {
		return decodeURIComponent(this).replace(/[_]/g, " ");
	 }
	 
	 function getParameterByName(name)
	 {
		name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
		var regexS = "[\\?&]" + name + "=([^&#]*)";
		var regex = new RegExp(regexS);
		var results = regex.exec(window.location.search);
		if(results == null)
			return "";
		else
			return decodeURIComponent(results[1].replace(/\+/g, " "));
	 }


	/**
	 *  Infinite List Controller
	 */
	var InfiniteListController = function() {}

	InfiniteListController.prototype.init = function(url, data, callback) {
		var self = this;
		this.reset();
		this.url = url;
		this.data = data || {};
		this.callback = callback || function(){};

		$(window).scroll(function() {
			if  ($(window).scrollTop() > ($(document).height() - $(window).height()) * 3/4 ){
				self.update();
			}
		});

		this.update();
	}

	InfiniteListController.prototype.reset = function() {
		$(window).unbind('scroll');
		this.page = 0;
		this.rows = Config.rows_per_page;
		this.lock = false;
	}

	InfiniteListController.prototype.showActivityIndicator = function(state) {
		if (state) {
			$('.activity_indicator').show();
		} else {
			$('.activity_indicator').hide();
		}
	}

	InfiniteListController.prototype.update = function() {

		var self = this;
		if (this.lock) return;

		this.lock = true;

		this.data['page'] = this.page;
		this.data['rows'] = this.rows;

		this.showActivityIndicator(true);

		$.ajax({
			url: this.url,
			data: this.data,
			success: function(results) {
				self.page += 1;
				if (results.length >= self.rows) {
					self.lock = false;
				}
				self.showActivityIndicator(false);
				self.callback(results);
			}
		});	
	}


	/**
	 * Search Controller
	 */

	var SearchController = function() {
		this.updateResults = false;
		this.sort = {
			'key':null,
			'order':1
		}
	}
	SearchController.prototype.intitDOM = function() {
		this.el = {
			'input': 		$('#global_search_input'),
			'query': 		$('.search_query'),
			'list': 		$('#pad-list'),
			'list_body': 	$('#pad-list > tbody'),
			'sort_fields': 	$('#pad-list > thead .sort_field'),
			'no_data':		$('.no_data')
		}

		this.el.input.focus();
	}

	SearchController.prototype.intitEvents = function() {
		var self = this;
		
		this.el.input.keyup(function() {
			var el = this;
			delay(function(){
				self.updateSearch($(el).val());
			}, Config.search_timeout );
		});

		$.route.bind('change', function(ev, attr, how, newVal, oldVal) {
			if (attr == 'q' || attr == 'k' || attr == 'o') {
				if (self.changeTimeout) {
					clearTimeout(self.changeTimeout);
				}
				self.changeTimeout = setTimeout(function(){
					self.setSortField();
					self.refresh();
				}, 500);
			}
		});

		var sort_order = $.route.attr('o'),
			sort_key = $.route.attr('k');

		this.el.sort_fields.each(function(i, el){
			
			var el_key = $(el).attr('data-sort-key');
			if (el_key == sort_key && sort_order) {
				self.setSortField(sort_key, sort_order);
			}
			$(el).click(function(){
				var sort_order = $.route.attr('o');
				if (!sort_order) {
					sort_order = 1;
				}
				self.setSortField($(this).attr('data-sort-key'), sort_order * -1);
			});
		});
	}

	SearchController.prototype.init = function() {
		this.intitDOM();
		this.intitEvents();
		this.refresh();
	}

	SearchController.prototype.refresh = function() {
		var q = $.route.attr('q');
		this.updateResults = true;

		if (q && q.length > 1) {
			this.el.input.val(q);
			this.runSearch(q);
		} else {
			this.list();
		}
	}
	
	SearchController.prototype.updateSearch = function(search_string) {
		search_string = encodeURIComponent(search_string);

		if (/\/list\//.test(window.location.href)) {
			$.route.attr('q',search_string);
		} else {
			//redirect to search page
			window.location.href = '/list/#!q=' + search_string;
		}
		this.updateResults = true;
	}
	
	SearchController.prototype.runSearch = function(search_string) {
		var self = this;
		this.el.query.show();
		this.el.query.text("Search: " + decodeURIComponent(search_string));

		var data = this.getSortField();
		data['query'] = search_string;

		this.InfiniteListController = new InfiniteListController().init('/api.json/search', data, function(results) {
			self.showResults(results);
		});
	}

	SearchController.prototype.setSortField = function(key, order, justDOM) {

		if (!key) key = $.route.attr('k');
		if (!order) order = $.route.attr('o');
		if (!key || !order) return;

		this.el.list.find('thead th img.sort').remove();

		var field = this.el.list.find('thead span[data-sort-key="'+key+'"]');
		if (field) {
			$(field).parent().append($('<img>').addClass('sort').attr('src', '../static/plugins/ep_portal/static/images/sort_' + order + '.png'));
		}
		
		if (!justDOM) {
			$.route.attr('k', key);
			$.route.attr('o', order);			
		}
	}

	SearchController.prototype.getSortField = function(defaults) {
		var key = $.route.attr('k'),
			order = $.route.attr('o');

		if (!key && defaults && defaults.key) {
			key = defaults.key;
		}
		if (!order && defaults && defaults.order) {
			order = defaults.order;
		}
		return {'key': key, 'order': order}
	}
	
	SearchController.prototype.list = function() {
		var self = this;
		this.el.query.hide();

		var data = this.getSortField({'key':'pad_id', 'order':1});
		this.setSortField(data.key, data.order, true);

		this.InfiniteListController = new InfiniteListController().init('/api.json/list', data, function(results) {
			self.showResults(results);
		});
	}

	SearchController.prototype.showResults = function(results) {

		if (this.updateResults) {
			this.el.list_body.html('');
			this.updateResults = false;
		}

		for (var k in results) {
			var pad = results[ k ];
			var date = $('<div>').text(moment(new Date(pad.modified)).fromNow());
			var dateString = $("<small>").text(moment(new Date(pad.modified)).format('MMMM Do YYYY, HH:mm'));

			var atitle = $('<a>').attr('href', '/pad/'+pad.pad_id).text(pad.pad_id.padId2Title())
				title = $('<td>').html($('<h2>').html(atitle)),
				summary = $('<td>').text(pad.content),
				authors = $('<td>'),
				activity = $('<td>').append(date).append(dateString),
				row = $('<tr>');

			$(pad.authors).each(function(i, author){
				if (author.name == "unnamed") return;
				authors.append( $('<a>').text(author.name).attr('class', 'btn btn-mini btn-primary') );
			});

			 row.append(title).append(summary).append(authors).append(activity);
			 this.el.list_body.append(row);
		}

		if (results.length == 0) {
			this.el.no_data.show();
			this.el.list.hide();
		} else {
			this.el.no_data.hide();
			this.el.list.show();
		}
	}

	/**
	 * Pad Controller
	 */

	var PadController = function() {
		return this;
	}

	PadController.prototype.getAvailableHeight = function() {
		var h = $(window).height() - $(this.el.container).offset().top - 60;
		return h < Config.pad_min_height ? Config.pad_min_height : h;
	}

	PadController.prototype.init = function(pad_id) {
		var self = this;
		this.el = {
			'container': $('#pad_container'),
			'title': $('.pad_title'),
		};

		this.el.title.text(pad_id.padId2Title());
		document.title = pad_id.padId2Title();

		$(this.el.container).pad({
			'host':'http://sandbox.imojo.de:9001',
			'padId':pad_id,
			'showControls':true,
			'showLineNumbers':true,
			'height':this.getAvailableHeight()
		});

		//@TODO: this needs to be fixed. I need some callback for the resize event. polling is more than suboptimal
		setInterval(function(){
			$('iframe').contents().find('#editorcontainer iframe').css('overflow', 'hidden');
			var h = $('iframe').contents().find('iframe').contents().find('iframe').contents().find('#innerdocbody').height()+55;
			var ah = self.getAvailableHeight();

			if (h > ah) {
				$('#pad_container iframe').height(h);
			} else {
				$('#pad_container iframe').height(ah);
			}
			
		},1000);

		return this;
	}

	
	$(document).ready(function(){

		
		var sc = new SearchController().init();

		var rePad = /\/pad\/(.+)/;
		if (rePad.test(window.location.href)) {
			var m = rePad.exec(window.location.href);
			if (m && m.length > 1) {
				new PadController().init(m[1]);
			}
		}

		
		$(".sideBar>ul>li.dropper>div").on("click",function(){
			$('.subSide').slideToggle();			
		});

		$("#btn_add_new_pad").on('click', function(){
			var pad_title = $('#new_pad_title').val();
			if (pad_title.length > 0 && pad_title.length <= 100) {
				window.location.href = '/pad/' + encodeURIComponent(pad_title);
			} else {
				alert("Please provide a valid pad title. A title can't be longer than 100 chars.");
			}
		});
	});
})();