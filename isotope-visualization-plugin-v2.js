(function($) {

var plugin = Echo.createPlugin({
	"name": "IsotopeVisualization",
	"applications": ["Stream", "Submit"],
	"dependencies": [{
		"url": "//cache.umusic.com/web_assets/_global/js/isotope/jquery.isotope.min.js", 
		"loaded": function() { return !!jQuery().isotope; }
	}, {
		"url": "//cache.umusic.com/web_assets/_global/js/isotope/jquery.isotope-centered.min.js",
		"loaded": function() { return !!jQuery.Isotope && !!jQuery.Isotope.prototype._getCenteredMasonryColumns; }
	}],
	"init": function(plugin, application) {
		
		var config = plugin.config.get(application);
		application.config.combine($.extend(true, {
			"columnWidth": 250,
			"isotope": {
				"itemSelector":".echo-item-content:not(.echo-item-children .echo-item-content)",
				"masonry": {
					"columnWidth": 270
				},
				"filter": "*",
				"animationOptions": {
					"duration": 600,
					"easing": "linear",
					"queue": false
				},
				// use only jQuery engine for animation in mozilla browsersdue to the issues with video display with CSS transitions
				"animationEngine": $.browser.mozilla || $.browser.msie ? "jquery" : "best-available"
			},
			"maxChildrenBodyCharacters": 140,
			"itemCSSClassByContentLength": {
				"echo-item-smallSizeContent": [0, 69],
				"echo-item-mediumSizeContent": [70, 120]
			}
		}, config), config);
	
		application.config.get("target").addClass("echo-isotope");
		//window["isotopeOptions"] = {};
		application.config.get("target").data("isotope-Options", {});
		var renderer = function(name, item, element, dom) {
			plugin.renderers.Item[name].apply(item,
				[element, dom, application]);
		};
				
		Echo.Localization.extend({
			"Plugins.Reply.replyControl": "Comment",
			"Item.childrenMoreItems": plugin.label("childrenMoreItems"),
			"Echo.Plugins.Like.youMustBeLoggedIn": "You must login to like"
			//"Stream.emptyStream": "No comments yet. Be the first!"
		});
		$.extend(plugin.labels, application.config.get("labels") || {});
		
		plugin.extendTemplate("Item", plugin.template, "replace", "echo-item-container");
		
		$.each(plugin.renderers.Stream, function(name, renderer) {
			plugin.extendRenderer("Stream", name, renderer);
		});
		
		$.each(plugin.renderers.Item, function(name) {
			plugin.extendRenderer("Item", name, function(element, dom) {
				renderer(name, this, element, dom);
			});
		});
		
		plugin.listenEvents(application);
		plugin.addCss(plugin.css);
		
		/* Isotope.AppendFiltered
		 * Extend Metafizzy Isotope with a new method to Append items to a container and apply current filters
		 */
		if(!!$.Isotope && !$.Isotope.prototype.appendedFiltered){
			$.extend( $.Isotope.prototype, {
			  appendedFiltered : function( $content, callback ) {
			  var instance = this;
			  this.addItems( $content, function( $newItems ) {
				instance._addHideAppended( $newItems );
				var $newFilteredItems = instance._filter( $newItems );
				//instance._sort();	Sorting results in SYNC error
				instance.layout( $newFilteredItems );
				instance._revealAppended( $newFilteredItems, callback );
			  });
			}
			});
		}
	}
});

plugin.isotopeOptions = {};

plugin.addLabels({
	"voteTitle": "I like this!",
	"childrenMoreItems": "View More Comments"
});

plugin.listenEvents = function(application) {
	//When the Stream Body is rendered...
	function _initIso(topic, data, contextId){
		var isoOptions = $.extend({}, plugin.config.get(application, "isotope"));
		var $target = $(data.target);
		var $body = $target.find(".echo-stream-body.echo-isotope");
		$.extend( true, isoOptions, $target.data("isotope-Options"), $body.data("isotope-Options"));
		//console.dir(isoOptions);
		plugin.isotopeOptions = isoOptions;
		$body.isotope(isoOptions);
	}
	var eid = application.subscribe("Stream.onRender", function(topic, data, contextId){
		setTimeout(function(){_initIso(topic, data, contextId);},0);//defer _initISo until after plugin event handlers
		application.unsubscribe("Stream.onRender", eid);
	});
	
	application.subscribe("Stream.onRerender", function(topic, data, contextId){
		setTimeout(function(){_initIso(topic, data, contextId);},0);
	});
	
	//When an Item is rendered...
	application.subscribe("Stream.Item.onRender", function(topic, data) {
		var $body = $(data.target).find(".echo-stream-body.echo-isotope");
		var item = application.items[data.item.data.unique], target = data.item.target;
		if(!item || item.depth > 0 ) return;
		plugin.set(item, "rendered", true);
		//TODO - Performace: set at end of stack with setTimeout & cleartimeout to prevent multiple calls
		var hId = application.subscribe("Stream.onReady", function(topic, data, contextId) {
			if(application.dom.content[0] == $body.parent()[0]){
				var $item = $(target), isoData = $body.data("isotope");
				$body.isotope("appendedFiltered", $item);
			}
			application.unsubscribe("Stream.onReady", hId);
		});
		application.dom.content.parent().one("destroy", function(){
			application.unsubscribe("Stream.onReady", hId);
		});
	});
	
	//If a new item has been received...
	application.subscribe("Stream.Item.onReceive", function(topic, data, contextId) {
		var hId = application.subscribe("Stream.Item.onRender", function(topic, data, contextId) {
			var $item = $(data.item.target);
			setTimeout(function(){
				$(".echo-stream-body.echo-isotope").isotope( "reloadItems" );
				plugin.refreshLayout(application); //TODO call after queue complete?
			},0);
			application.unsubscribe("Stream.Item.onRender", hId);
		});
		application.dom.content.parent().one("destroy", function(){
			application.unsubscribe("Stream.Item.onRender", hId);
		});
	});
	
	//If another plugin has updated isotope...
	application.subscribe("Stream.Plugins.IsotopeVisualization.onRefresh", function(topic, data, contextId) {
		plugin.refreshLayout(application);
	});
	
	application.subscribe("Stream.onReady", function(topic, data, contextId) {
		plugin.FBCanvasUpdate(true);
	});
	
	
};

plugin.FBCanvasUpdate = function(timeout){
	try{
	/*if(!!FB && !!FB.Canvas && !!window.parent){
		function fbs(){
			FB.Canvas.setSize({height:$(document).height()});
		}
		if(!!timeout){
			setTimeout(fbs,800); //slideTimeout?
		}else{
			fbs();
		}
	}*/
	if(!!FB && !!FB.Canvas && !!window.parent){
		FB.Canvas.setAutoGrow(true);
	}
	}catch(ex){}
}

plugin.refreshLayout = function(application) {
	//$("."+application.dom.content[0].className.split(" ").join("."))
	var $body = $(".echo-stream-body.echo-isotope");
	try{
		//$body.isotope(plugin.config.get(application, "isotope"));
		$body.isotope(plugin.isotopeOptions);
	}catch(e){
		if(!!console && !!console.warn)
			console.warn("WARN: Isotope-Echo SYNC error - reloadItems", e);
		$(".echo-stream-body.echo-isotope").isotope( "reloadItems" );		
	}
	//plugin.FBCanvasUpdate();
};

plugin.isRootItem = function(item) {
	return !item.config.get("children.maxDepth") || item.id == item.conversation;
};

plugin.renderers = { Stream:{}, Item: {}, Submit: {} };

plugin.renderers.Item.content = function(element, dom, application) {
	var item = this;
	item.parentRenderer("content", arguments);
	if (application.isRootItem(item)) {
		element.bind({
			"mouseout": function() {
				element.removeClass("mouseover");
			},
			"mouseover": function() {
				element.addClass("mouseover");
			}
		});
	}
};

plugin.renderers.Stream.body = function(element, dom, application){
	var item = this;
	item.parentRenderer("body", arguments);
	if(!!element)
		element.addClass("echo-isotope");
};

plugin.renderers.Item.container = function(element, dom, application) {
	var item = this;
	item.parentRenderer("container", arguments);
};

plugin.renderers.Item.topRightContent = function(element, dom, application) {
	var item = this;
	if (!application.isRootItem(this)) {
		var commentLength = plugin.config.get(item, "maxChildrenBodyCharacters");
		var text = this.data.object.content.replace(/(<img.+\/>)|(<object.+<\/object>)|(<embed.+<\/embed>)|(<iframe[^<]+<\/iframe>)/,"");
		var full = text
		var truncated = $.htmlTextTruncate(text, commentLength);
		var $more = $('<a href="javascript:void(0)" title="show full comment"> ... more</a>').click(function(e){
			var $this = $(this);
			var isTruncated = element.data("isTruncated");
			if(isTruncated){
				$this.text(" less");
				element.find(".a01-comment").html(full);
			}else{
				$this.text(" ... more");
				element.find(".a01-comment").html(truncated);
			}
			element.data("isTruncated", !isTruncated);
			plugin.refreshLayout();
		});
		element.empty().append('<span class="a01-comment" >'+truncated+'</span>');
		if(full != truncated){
			element.append($more);
			element.data("content", full);
			element.data("truncated", truncated);
			element.data("isTruncated", true);
		}
	}
};

plugin.renderers.Item.votesCount = function(element, dom, application) {
	if (application.isRootItem(this)) {
		var item = this;
		var count = item.data.object.accumulators.likesCount;
		if (!count) {
			element.hide();
			return;
		}
		var displayCount = count;		
		if (count > 1000) {
			displayCount = (count/1000).toFixed(1) + "K";
		} else {
			displayCount =  Math.round(count);
		}
		element.text(displayCount);
		return displayCount;
	}
};

plugin.renderers.Item.voteButton = function(element, dom, application) {
	var config = plugin.config.get(application);
	if (application.isRootItem(this)) {
		var item = this;
		var youLike = false;
		if (!item.user.logged()) {
			var userId = item.user.get("id");
			var users = item.data.object.likes;
			$.each(users, function(i, like) {
				if (like.actor.id == userId) {
					youLike = true;
					return false; // break
				}
			});
		}
		
		element.hover(function(){$(this).addClass("mouseover");}, function(){$(this).removeClass("mouseover");});
		
		element.click(function() {
			if($(this).is("[enabled=false]")){return false;}
			if (youLike) {
				element.qtip({content:"You've already liked this item!", hide:"unfocus", position:{my:"bottom center", at:"top center"}, style: { classes: "ui-tooltip-light ui-tooltip-rounded ui-tooltip-echo-voteButton ui-tooltip-info" } } );
				element.qtip("show");
				setTimeout(function(){element.qtip("destroy");}, 2000);
				if( $({}).enableCapture ){
					$({}).enableCapture('signinLink').click();
				}
				return;
			}
			if (!item.user.logged()) {
				element.qtip({content:Echo.Localization.label("youMustBeLoggedIn","Echo.Plugins.Like"), hide:"unfocus", position:{my:"bottom center", at:"top center"}, style: { classes: "ui-tooltip-light ui-tooltip-rounded ui-tooltip-echo-voteButton ui-tooltip-error" } } );
				element.qtip("show");
				setTimeout(function(){element.qtip("destroy");}, 2000);
				if( $({}).enableCapture ){
					$({}).enableCapture('signinLink').click();
				}
				return;
			}
			Echo.Plugins.Like.sendRequest(application, {
				"verb": "like",
				"target": item.id
			}, function(data) {
				application.publish("Stream.Plugins.Like.onLikeComplete", {
				target:application.dom.content, 
				query: application.config.data.query, 
				item:{target: element, data: item.data}});
				application.startLiveUpdates(true);
			});
		});
	}
};

plugin.renderers.Item.body = function(element, dom, application) {
	if (application.isRootItem(this)) {
		var item = this;
		item.parentRenderer("body", arguments);
		var $body = element.find(".echo-item-body"),
			$text = element.find(".echo-item-text"),
			$metadata = $text.children(".metadata"),
			$images = $metadata.find("img"),
			$media = $metadata.find("iframe,object,embed");
		plugin.set(item, "hasMedia", !!$media.length);
		if(!!$images.length || !!$media.length){
			$metadata.detach();
			$text.prepend($metadata);
		}
		element.find("img").imagesLoaded(function(){
			plugin.refreshLayout(application);
		});
		var itemCSSClassByContentLength = function(length) {
			return $.foldl("", plugin.config.get(item, "itemCSSClassByContentLength"), function(range, acc, className) {
				if (length < range[1])
					return (acc = className);
			});
		};
		var text = $.stripTags(item.data.object.content);
		element.addClass(itemCSSClassByContentLength(text.length));
	}
};

plugin.renderers.Item.date = function(element, dom, application) {
		var item = this;
		item.parentRenderer("date", arguments);
		//<span class="echo-item-time-icon"></span>
		var when;
		var d = new Date(this.timestamp * 1000);
		var now = (new Date()).getTime();
		var diff = Math.floor((now - d.getTime()) / 1000);
		var dayDiff = Math.floor(diff / 86400);
		var getAgo = function(ago, period) {
			return ago + " " + item.label(period + (ago == 1 ? "" : "s") + " Ago");
		};
		if (dayDiff >= 365) {
			diff =  Math.floor(dayDiff / 365);
			when = getAgo(diff, 'Year');
			if (item.age != when) {
				item.age = when;
				element.children("a").text(when);
			}
		}
};

plugin.renderers.Item.expandChildren = function(element, dom, application) {
	if (application.isRootItem(this)) {
		this.parentRenderer("expandChildren", arguments);
		setTimeout(function() {	plugin.refreshLayout(application); }, 0);
	}
};

plugin.template =
	'<div class="echo-item-container">' +
		'<div class="echo-item-header">' +
			'<div class="echo-item-avatar"></div>' +
			'<div class="echo-item-topContentWrapper">' +
				'<div class="echo-item-authorName echo-linkColor"></div>' +
				'<div class="echo-item-topRightContent">' +
					'<div class="echo-item-voteButton" title="'+plugin.label("voteTitle")+'"></div>' +
					'<div class="echo-item-votesCount"></div>' +
					'<div class="echo-clear"></div>' +
				'</div>' +
				'<div class="echo-clear"></div>' +
			'</div>' +
			'<div class="echo-clear"></div>' +
		'</div>' +
		'<input type="hidden" class="echo-item-modeSwitch">' +
		'<div class="echo-item-wrapper">' +
			'<div class="echo-item-data">' +
				//'<div class="echo-item-media"></div>' + 
				'<div class="echo-item-body echo-primaryColor"> ' + 
					'<span class="echo-item-text"></span>' +
					'<span class="echo-item-textEllipses">...</span>' +
					'<span class="echo-item-textToggleTruncated echo-linkColor echo-clickable"></span>' +
				'</div>' +
				'<div class="echo-item-markers echo-secondaryFont echo-secondaryColor"></div>' +
				'<div class="echo-item-tags echo-secondaryFont echo-secondaryColor"></div>' +
			'</div>' +
			'<div class="echo-item-footer echo-secondaryColor echo-secondaryFont">' +
				'<div class="echo-item-from"></div>' +
				'<div class="echo-item-via"></div>' +
				'<div class="echo-item-controls"></div>' +
				'<div class="echo-clear"></div>' +
				'<img class="echo-item-sourceIcon echo-clickable"/>' +
				'<div class="echo-item-date"></div>' +
				'<div class="echo-clear"></div>' +
			'</div>' +
		'</div>' +
	'</div>';

// Compressed version of /_global/css/isotope/isotope-visualization-v2.css
plugin.css = "/*FONTS*/ .echo-isotope .echo-primaryColor{color:#7f7f85;} .echo-isotope .echo-item-smallSizeContent{font-size:18px;line-height:25px} .echo-isotope .echo-item-mediumSizeContent{font-size:16px;line-height:22px} .echo-isotope .echo-linkColor,.echo-isotope .echo-linkColor a,.echo-isotope .echo-item-content .echo-item-body a,.echo-isotope .echo-item-topRightContent a{text-decoration:none;font-weight:bold;color:#524D4D} .echo-isotope .echo-linkColor a:hover,.echo-isotope .echo-item-content .echo-item-body a:hover,.echo-isotope .echo-item-topRightContent a:hover{text-decoration:underline} .echo-isotope .echo-item-date, .echo-isotope .echo-item-date a {color:#4f4f4f;font-weight:300;text-decoration:none;} .echo-isotope .echo-item-footer a,.echo-isotope .echo-item-footer a .echo-linkColor{color:#ccc;text-decoration:none;font-weight:700;background:none;border:none;margin:0px;padding:0px} .echo-isotope a.article_title:link,.echo-isotope a.article_title:visited,.echo-isotope .echo-item-data .note_title,.echo-isotope .article_tweet{font-family:'raleway',helvetica, arial, sans-serif;text-decoration:none;font-weight:500;font-size:14px;line-height:1.2;padding:0px;margin:0;letter-spacing:0em; width:auto;} /* STREAM */ .primary{width:auto;} html,body{ min-height:100%} .echo-isotope .echo-stream-body.isotope{min-width:100%!important; min-height:400px;} .echo-isotope .echo-stream-header{margin:0;} .echo-isotope .echo-stream-state-message {color:#4f4f4f; position:relative; right:5%; margin-right:20px; float:right;} .echo-isotope .echo-application-message { position:relative;width:auto;border:none} .echo-isotope .echo-application-message-loading{ width: 100%; margin: 0 auto; background:url('//cache.umusic.com/web_assets/_global/images/icons/spinning.gif') no-repeat center; padding: 30px; } /* CONTENT ITEM */ .echo-isotope .echo-stream-body > .echo-item-content { width:225px; } .echo-isotope .echo-stream-body > .echo-item-content.rich-media{ width:490px; } /******/ .echo-isotope .echo-stream-body > .echo-item-content {margin:5px 0px; position:relative; left:0px; } .echo-isotope .echo-item-content{background:white;box-shadow:0 1px 2px rgba(34,25,25,0.4);border:0px solid gray} .echo-isotope .echo-item-depth-0{width:auto;padding:15px 0;} /*.echo-item-container { background-color: #000000; } */ /*HACK: Liveupdates fix*/ .echo-isotope .echo-item-header{ display:block; clear:both; height:30px; padding:0 0 0 10px;} .echo-isotope .echo-item-wrapper{float:none } .echo-isotope .echo-item-depth-0 .echo-item-topContentWrapper{float:none; display:block; position:relative; top:3px; padding:0 0 0 30px; margin:0px; width:auto; } .echo-isotope .echo-item-depth-0 .echo-item-topRightContent{margin: 0px 5px; position:absolute; right:0px; top: 0px;} .echo-isotope .echo-item-depth-0 .echo-item-authorName, .echo-isotope .echo-item-depth-0 .echo-item-tweetUserName {font-weight:700; font-size:11px; font-family:'adelle', helvetica, arial, sans-serif; letter-spacing:0; margin-left:5px; text-transform:uppercase; line-height:1; float:none;} .echo-isotope .echo-item-depth-0 .echo-item-tweetUserName{display:none;} .echo-isotope .echo-source-twitter .echo-item-depth-0 .echo-item-tweetUserName{display:block;} .echo-isotope .echo-item-depth-0 .echo-item-authorName.echo-item-tweetScreenName{ float:none; font-size: .7em; margin: 3px 0 0 8px;} .echo-isotope .echo-item-avatar{float:left;width:30px;height:30px} .echo-isotope .echo-item-avatar img{width:30px!important; height:30px!important;float: none; display:inline; } .echo-isotope .echo-item-votesCount{float:right;margin-top:5px;color:#524D4D;font-weight:bold;margin-right:3px} .echo-isotope .echo-item-voteButton{opacity:0.4;cursor:pointer;display:block;float:right;height:16px;width:16px;background:url('//cache.umusic.com/web_assets/_global/images/icons/heart.png') repeat scroll 0 0 transparent;margin-left:3px;margin-top:4px} .echo-isotope .echo-item-voteButton.mouseover{opacity:1;} .echo-isotope .echo-item-likes{color:#8f8f99;border-color:rgba(150,150,150,.15);margin:5px;padding:5px 0 0 21px; font-size:10px;} /** BODY */ .echo-isotope .echo-item-data{ padding:0px 8px 0 10px; margin:0px 0 5px; } .echo-isotope .echo-item-body{ margin-top:5px; float:none; width:100%; max-width:100%; } .echo-isotope .echo-item-files, .echo-isotope .echo-item-photo, .echo-isotope .echo-item-photo img{ max-width:100%; -moz-box-sizing:border-box; box-sizing:border-box } .echo-isotope .echo-item-photo img,.echo-isotope .echo-item-photo img:hover{border:none; padding:0} .echo-isotope .echo-item-body .article_body img.fullsize, .echo-isotope .echo-item-body  img.metadata_image, .echo-isotope .echo-item-body  img.metadata_image_web,.echo-isotope .echo-item-photo img,.echo-isotope .echo-item-body .metadata_image_div img{float:none; max-width:100%; width:auto; height:auto; margin-left:auto; margin-right:auto; display:block;} .echo-isotope .echo-item-text{ display:block; } .echo-isotope .echo-item-data div.article_media img{height:auto;} .echo-isotope .echo-item-body img, .echo-isotope .echo-item-body iframe, .echo-isotope .echo-item-body object, .echo-isotope .echo-item-body embed{max-width:100%;max-height:100%; width:auto;} /** Web.stagram */ .echo-isotope .echo-source-web-stagram-com img.hoverZoomLink{display:none;} .echo-isotope .echo-source-web-stagram-com div.article_body span p:first-child,.selected-instagram div.article_body span p:nth-child(3){display:none;} /** FOOTER */ .echo-isotope .echo-item-footer{margin-top:5px; clear:both; float:none; margin-bottom: 0px; box-shadow:inset 0px 1px 0 #D9D4D4; padding:8px 8px 10px 10px; color:#5f5f5f;} .echo-isotope .echo-item-footer a:hover{text-decoration:underline} .echo-isotope .echo-item-tags,.echo-isotope .echo-item-markers{display:none }.echo-item-controls > .echo-item-control-delim:first-child{display:none;} /** METADATA */ .echo-isotope .echo-item-data .metadata{overflow:visible; clear:both;margin:0px 0 5px 10px; padding-left:0;} .echo-isotope .echo-item-data .metadata, .echo-isotope .metadata_description_div{ float:none; width:100%; color:#4f4f55; } .echo-isotope a.metadata_link{display:block;} .echo-isotope .echo-item-body .metadata_image_div{width:100%; max-width:100%;} .echo-isotope .metadata_image{border:0px;padding:0; margin:0; width:inherit;height:auto;max-height:none;} .echo-isotope .metadata_title{font-weight:500; font-size:13px;text-decoration:none; padding:3px 0; line-height:1; color:#0f0f1f;font-family:'raleway', helvetica, arial, sans-serif; position:relative;} .echo-isotope .metadata_title a{font-weight:700; color:#fff; font-size:13px; } .echo-isotope .metadata_description{color:#4f4f55;line-height:1.1;padding:3px 0; font-size:11px; margin-top:2px;} .echo-isotope .meta_video iframe, .echo-isotope .echo-item-data .metadata_description_div, .metadata_description_div iframe, .echo-item-data .metadata_description_div object, .echo-item-data .metadata_description_div embed, .echo-item-text span iframe, .echo-isotope .echo-item-body iframe, iframe.itunes{width:100%; max-width:100%!important; margin:0; } .echo-isotope .echo-item-container-child{margin:0px ;padding:5px 5px } /** EXPAND */ .echo-isotope .echo-item-expandChildren{width:100%;padding:5px 0 ;font-weight:500;font-family:'proxima-nova',helvetica,arial,sans-serif; border-bottom:1px solid #EEEEEE;background-color:#EEEEEE; color:#000;} .echo-isotope .echo-item-expandChildren span,.echo-isotope .echo-item-expandChildren a{font-weight:700; color:#151515; text-shadow:0 1px 0 #5f5f5f; font-size:11px; text-transform:uppercase;} .echo-item-expandChildren .echo-item-expandChildrenLabel{padding:0px;} .echo-isotope .echo-item-expandChildren .echo-item-message-loading{background-image:none ;font-weight:bold} .echo-isotope .echo-item-expandChildren .echo-message-icon{background-image:none } .echo-isotope .echo-item-expandChildrenLabel{padding:0px;background-image:none} /** CHILDREN */ .echo-isotope .echo-item-depth-1{margin-left:0px } .echo-isotope .echo-item-children{max-height:300px;overflow-x:hidden;overflow-y:auto; width:auto; padding:0; background:#111; background:rgba(90,90,90,.3); } .echo-isotope .echo-item-children .echo-item-content{margin:0px;padding:4px;border:0px;border-bottom:0 none; border-top: 1px solid #D9D4D4; box-shadow:none; background-color:#F2F0F0;width:auto;padding:8px 5px 6px 10px} .echo-isotope .echo-item-children .echo-item-content:first-child{border-top: 0px none;} .echo-isotope .echo-item-children .echo-item-content:last-child{border-bottom:0px} .echo-isotope .echo-item-children .echo-item-container{background-color:#F2F0F0;padding:0;position:relative;} .echo-isotope .echo-item-children .echo-item-wrapper{display:none} .echo-isotope .echo-item-children .echo-item-header{height:auto; padding: 0 0 0 5px; margin-left:0px;} .echo-isotope .echo-item-children .echo-item-topContentWrapper{float:none;width:auto;top:0;margin:0;padding:0; display:inline;} .echo-isotope .echo-item-children .echo-item-topRightContent{float:none; width:auto; display:inline;margin:0 0 0 10px;color:#6f6f77;font-size:10px;line-height:1.2; position:relative;} .echo-isotope .echo-item-children .echo-item-avatar, .echo-isotope .echo-item-children .echo-item-avatar img{width:20px!important; height:20px!important; margin-right:5px; display:inline} .echo-isotope .echo-item-children .echo-item-tweetUserName, .echo-isotope .echo-item-children .echo-item-authorName{float:none;display:block;margin-left:0px;padding-right:4px} .echo-isotope .echo-item-children .echo-item-authorName.echo-item-tweetScreenName{ display: none; } .echo-isotope .echo-item-children .echo-item-authorName, .echo-isotope .echo-item-children .echo-item-tweetUserName{ font-size:.8em; margin:0 8px 0 0; display:block; } .echo-isotope .echo-item-children .echo-item-date, .echo-isotope .echo-item-children .echo-item-from, .echo-isotope .echo-item-children .echo-item-via{ float:none;display:inline-block;} .echo-isotope .echo-item-children a{color:#7f7f85;} .echo-isotope .echo-item-children .echo-item-replyForm{padding:0;}.echo-isotope .echo-item-children .echo-item-expandChildren{display:none;} /** REPLY FORM*/ .echo-isotope .echo-item-replyForm { padding:4px 8px; border-color:#1f1f1f; position:relative;} /*.echo-isotope .mouseover .echo-item-replyForm{ display:none; } .echo-isotope .mouseover .echo-item-replyForm{ display:block; }*/ .echo-isotope .echo-item-replyForm.echo-item-container{background-color:#F2F0F0;border:1px solid #D9D4D4; border-top:none;} .echo-isotope .echo-submit-content {width:auto;} .echo-isotope .echo-submit-controls {background:none;border:none;box-shadow: none;border-radius:none;margin:4px 0 0 0;} .echo-isotope .echo-submit-upload-button-container{height: 20px;margin: 0 0 0 10px;padding: 0px;} .echo-isotope .echo-submit-socialsharing{ position:relative; left:-4px; } .echo-isotope .echo-submit-socialsharing input{float:left} .echo-isotope .echo-submit-socialsharing, .echo-isotope .echo-submit-forcedLoginUserInfoMessage{font-size:10px; letter-spacing:-.05em;} .echo-isotope .echo-submit-body{border:none} /* Twitter Intents */.echo-isotope .echo-item-children .echo-item-timestamp{display:block}.echo-isotope .echo-item-children .echo-item-footer{position:absolute;bottom:0px;right:0px;border:0px none;box-shadow:none;padding:0;margin:0}.echo-isotope .echo-item-children .echo-item-controls{float:right}.echo-isotope .echo-item-children .echo-item-intentControl span{display:none}.echo-isotope .echo-item-children .echo-item-intentControl .echo-item-twitterIntentsIcon{display:inline-block} /* ISOTOPE */ .isotope-item{ } .isotope-hidden.isotope-item{ pointer-events:none; display:none} .isotope .isotope-item{ -webkit-transition-duration:0.8s; -moz-transition-duration:0.8s; -o-transition-duration:0.8s; transition-duration:0.8s} .isotope{ -webkit-transition-property:height,width; -moz-transition-property:height,width; -o-transition-property:height,width; transition-property:height,width} .isotope .isotope-item{ -webkit-transition-property:-webkit-transform,opacity; -moz-transition-property: -moz-transform,opacity; -o-transition-property: top,left,opacity; transition-property: transform,opacity} .isotope.no-transition,.isotope.no-transition .isotope-item,.isotope .isotope-item.no-transition{ -webkit-transition-duration:0s;-moz-transition-duration:0s; -o-transition-duration:0s; transition-duration:0s}";	
})(jQuery);
