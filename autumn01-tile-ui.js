(function($) {

var plugin = Echo.createPlugin({
	"name": "Autumn01TileUI",
	"applications": ["Stream"],
	"dependencies": [
	{
		"url": "http://cache.umusic.com/web_assets/_global/js/isotope/jquery.scrollTo.min.js",
		"loaded": function() { return !!jQuery.scrollTo; }
	}	
	],
	"init": function(plugin, application) {
		var renderer = function(name, item, element, dom) {
			plugin.renderers.Item[name].apply(item,
				[element, dom, application]);
		};
		
		plugin.extendTemplate("Item", plugin.Templates.container, "replace", "echo-item-container");		
		Echo.Localization.extend({
			"loading":'<img src="/_local/images/3-circle.gif" />',
			"more":" "
		}, "Stream");
		Echo.Localization.extend({
			"loading":" "
		}, "");
		//RENDERERS
		plugin.extendRenderer("Stream", "body", function(element, dom) {
			plugin.renderers.Stream.body.apply(this, [element, dom, application]);
		});
		
		$.each(plugin.renderers.Item, function(name) {
			plugin.extendRenderer("Item", name, function(element, dom) {
				renderer(name, this, element, dom);
			});
		});
		
		plugin.listenEvents(application);
		plugin.addCss(plugin.css);
	}
});

plugin.listenEvents = function(application) {
	//If a new item has been received...
	application.subscribe("Stream.Item.onReceive", function(topic, data, contextId) {
		var hId = application.subscribe("Stream.Item.onRender", function(topic, data, contextId) {
			application.unsubscribe("Stream.Item.onRender", hId);
		});
	});
	
	var eid = application.subscribe("Stream.onRender", function(topic, data, contextId) {
		plugin.setMasonry($(data.target).find(".echo-stream-body"), application);
		application.unsubscribe("Stream.onRender", eid);
	});
	
	application.subscribe("Stream.onRerender", function(topic, data, contextId) {
		plugin.setMasonry($(data.target).find(".echo-stream-body"), application);
	});
};

plugin.setMasonry = function(stream, app){
	var $target = app.config.data.target;
	if($target.is(".videos") && $(window).width() > 1175){
		$.extend(true, plugin.isoOptions, {masonry:{columnWidth:587}});
		//console.warn("masonry: 587");
	}else{
		$.extend(true, plugin.isoOptions, {masonry:{columnWidth:235}});
		//console.warn("masonry: 235");
	}
	stream.data("isotope-Options", $.extend(true, stream.data("isotope-Options") || {}, plugin.isoOptions));
};

plugin.query = "";
plugin.isoOptions = {};

plugin.renderers = {Item: {}, Stream: {}};

plugin.renderers.Stream.body = function(element, dom, application){
	var item = this;
	item.parentRenderer("body", arguments);
	if(plugin.query != item.config.data.query){
		plugin.query = item.config.data.query;
		plugin.set(application, "detail_item", null);
	}
	if(!!application.lastRequest) return;
};

plugin.renderers.Item.likesCount = function(element, dom, application) {
	if (application.isRootItem(this)) {
		var item = this;
		var count = item.data.object.accumulators.likesCount, displayCount; // -> Echo Count?
		/*if (!count){
			var $likes = element.parent().hide();
			$likes.siblings(".echo-item-a01-separator").hide();
			return;*/
		if (count > 1000) {
			displayCount = (count/1000).toFixed(1) + "K";
		} else {
			displayCount = Math.round(count);
		}
		element.text(displayCount);
		return displayCount;
	}
};

plugin.renderers.Item.repliesCount = function(element, dom, application) {
	if (application.isRootItem(this)) {
		var item = this;
		var count = item.data.object.accumulators.repliesCount, displayCount; // -> Echo Count?
		if (!count) return;
		if (count > 1000) {
			displayCount = (count/1000).toFixed(1) + "K";
		} else {
			displayCount = Math.round(count);
		}
		element.text(displayCount);
		return displayCount;
	}
};

plugin.renderers.Item.likes = function(element, dom) {
	var item = this;
};

plugin.renderers.Item.via = function(element, dom, application) {
	var item = this;
	item.parentRenderer("via", arguments);
};

plugin.renderers.Item.content = function(element, dom, application) {
	var item = this;
	item.parentRenderer("content", arguments);
	if(item.depth > 0){
		if(item.data.object.objectTypes == "http://activitystrea.ms/schema/1.0/article"){ element.css({"display":"none"}); }
		return;
	}
	
	function cssEncode(str){ if(!str) return ""; return str.replace(/[\s'"&,]/g,"").toLowerCase(); }
	function tagEncode(str){
		if(!str) return "";
		str = str.replace(/[\s]/g,"&nbsp;");
		if(str.length > 4){ str = str.toTitleCase(); }
		return str;
	}
	
	var eSource = item.data.source.uri.toLowerCase();
	if(!!eSource && eSource.indexOf("feed.interscope.com/mg/") >= 0){
		element.addClass("a01-release");
	}else if(!!eSource && eSource.indexOf("feed.interscope.com/soundcloud/") >= 0){
		element.addClass("a01-release");
	}else if(!!eSource && eSource.indexOf("feed.interscope.com/bravado/") >= 0){
		element.addClass("a01-bravado");
	}else{
		for(var i=0; i<item.data.targets.length;i++){
			if(/id_\w+\Releases\d*/.test(item.data.targets[i].id)){
				element.addClass("a01-release"); break;
			}else if(/\/news\/default\.aspx\?nid=/.test(item.data.targets[i].id)){
				element.addClass("a01-news");
			}
		}
	}
	
	element.find("a[target*=_top]").attr("target","_blank");//override blank-links -> _top
	
	var detailItem = plugin.get(application, "detail_item");
	var isEchoPerma = (location.hash.indexOf("!p=") == 1);
	if( detailItem || isEchoPerma ){
		if(isEchoPerma || detailItem.item.id == item.id){
			plugin.setDetailView(element, item, true, application);
		}else{
			element.addClass("fade20").addClass("summary");
		}
	}else{
		element.addClass("summary");
	}
	if(isEchoPerma){
		var hId = application.subscribe("Stream.onReady", function(topic, data, contextId) {
			//plugin.scrollTo(element, false);
			application.unsubscribe("Stream.onReady", hId);
		});
	}
	var $body = $("."+application.dom.content[0].className.split(" ").join(".") + " .echo-stream-body");
	var $itemBody = element.children(".echo-item-container").find(".echo-item-body");
	
	if(element.is(".a01-release")){
		var $productImage = element.find(".productImage img");
		if($productImage.length > 0){
			$productImage.attr("src",$productImage.attr("src").replace(/\.\w{1,4}$/,".jpg"));
		}
		var $releaseDetails = $itemBody.find(".productReleaseDetails");
		var spotifyUri = $releaseDetails.attr("data-spotify-uri"),
			spotifyUrl = $releaseDetails.attr("data-spotify-url"),
			soundcloudId = $releaseDetails.attr("data-soundcloud-id"),
			soundcloudUrl = $releaseDetails.attr("data-soundcloud-url");
		plugin.set(item, "a01.spotifyUri", spotifyUri);
		plugin.set(item, "a01.soundcloudId", soundcloudId);
		plugin.set(item, "a01.soundcloudUrl", soundcloudUrl);
		if(!!spotifyUri){
			$(plugin.SpotifyButtonTemplate.format({title:element.find(".productTitle").first().text()})).insertAfter($releaseDetails);
		}else if(!!soundcloudUrl || !!soundcloudId ){
			$(plugin.SoundcloudButtonTemplate.format({title:element.find(".productTitle").first().text() })).insertAfter($releaseDetails);
		}
	}else if(element.is(".a01-bravado")){
		var $footer = element.find(".echo-item-commentCount"),
		$buyLink = element.find(".productBuyLink a"),
		$description = element.find(".productDescription"),
		$meta = element.find(".productMetadata");
		var category = $meta.find(".category").attr("data-category") || "",
		catalog = $meta.find(".department").attr("data-catalog") || "";
		store = $meta.find(".store").attr("data-catalog") || "";
		$buyLink.hide();
		
		var $tags = $('<div class="productTags"><ul></ul></div>');
		if(category != "")
			$tags.children("ul").append(plugin.BravadoTagTemplate.format({tag:tagEncode(category), css:cssEncode(category) }));
		if(catalog != store && catalog != "" && catalog.toLowerCase().indexOf("new") !== 0 && catalog.toLowerCase().indexOf("featured") !== 0){
			$tags.children("ul").append(plugin.BravadoTagTemplate.format({tag:tagEncode(catalog), css:cssEncode(catalog) }));
		}
		var date = Date.parse(item.data.postedTime), now = new Date(), msDays = 86400000;
		if(!!date && ( now.getTime() - date <= 14 * msDays )){
			$tags.children("ul").append(plugin.BravadoTagTemplate.format({tag:"New!", css:"new" }));
		}
		$description.after($tags);
		$description.after('<div class="vertical-more expand"><div><span>&#8230;</span></div></div>');//&#8942;
		$footer.find(".echo-item-a01-comments").after(plugin.BuyLinkTemplate.format({url:$buyLink.attr("href"), title:item.data.object.title.replace('"', '\"') }));
		plugin.setDetailView(element, item, element.is(".detail"), application);	
	}
	
	function createUserList(size){
		size = size || 8;
		var $target = element.children(".echo-item-container").find(".echo-item-likes");
		new Echo.UserList(plugin.assembleConfig(item, {
			"name":"Like",
			"target": $target,
			"data": {
				"itemsPerPage": size,
				"entries": item.data.object.likes
			},
			"initialUsersCount": size,
			"totalUsersCount": item.data.object.accumulators.likesCount
		}));
		$target.find(".echo-user-list-item-container").each(function(){
			var $this = $(this), 
				$avatar = $this.find(".echo-user-list-item-avatar"), 
				$title = $this.find(".echo-user-list-item-title");
			$avatar.attr("title", $title.text());
		});
	}
	if(element.is(".rich-media") ){
		createUserList(18);
	}else{
		createUserList();
	}
	
	element.click(function(e){
		var $target = $(e.target);
		if( $target.is("a img, a.expand") || !$target.is("a, a *, .no-expand, .no-expand *") ){
			if(!element.is(".detail")){ //To Detail
				e.preventDefault();
				plugin.set(application, "detail_item", {element: element, item: item });
				$body.isotope( "updateSortData", $body.find(".isotope-item.detail").each(function(){
					plugin.setDetailView($(this), item, false, application);
				}));
				plugin.setDetailView(element, item, true, application);				
				$body.find(".isotope-item").not(".detail;").addClass("fade20");
				$body.isotope( "updateSortData", element );
				Echo.Broadcast.publish("Stream.Plugins.IsotopeVisualization.onRefresh", {}, application.config.data.contextId);
				plugin.scrollTo(element, false);
				createUserList(18);//MAX 20
			}
		}
		setTimeout(function(){$("body").bind("click", onblur);});
	});
	
	function onblur(e){
		var $target = $(e.target);
		if(element.has(e.target).length === 0 && !$target.is("#sb-container *") && !$target.is("#ft *")){
			$("body").unbind("click", onblur);
			onclose(e);
		}
	}
	
	function onclose(e){
		if(element.is(".detail")){//Collapse
			plugin.set(application, "detail_item", null);
			plugin.setDetailView(element, item, false, application);
			$body.find(".isotope-item").removeClass("fade20");	
			e.stopImmediatePropagation();
			Echo.Broadcast.publish("Stream.Plugins.IsotopeVisualization.onRefresh", {}, application.config.data.contextId);
			setTimeout(function(){plugin.scrollTo(element, true);},0);
			createUserList();
		}
	}
	element.find(".echo-item-close").click(onclose);
	element.find(".echo-item-a01-comments .comment-icon").hover(function(){$(this).addClass("mouseover");}, function(){$(this).removeClass("mouseover");});	
};

plugin.renderers.Item.expandChildren = function(element, dom, application) {
	if (application.isRootItem(this)) {
		this.parentRenderer("expandChildren", arguments);
	}
};

/* 
 * Use jquery.scrollTo.js to scroll to an isotope element on the page. This uses both the page offset and css translation from isotope
 */
plugin.scrollTo = function(elt, scrollOffset){
	var $elt = $(elt), offset = $elt.offset(), position = $elt.position();
	var cssTranslationRegEx = /translate(?:\dd)?\((\d+)px, (\d+)px/, cssPositionRegex = /position: absolute; opacity: \d+; left:\s+(\d+)px; top:\s+(\d+)px/;
	function scroll(){
		var translation = {top:0, left:0};
		function _translation(g){
			if(!!g && g.length > 2){
				return {left: parseInt(g[1], 10), top: parseInt(g[2], 10)};
			}
		}
		var t = _translation(cssTranslationRegEx.exec($elt.attr("style")));
		if(!t) t = _translation(cssPositionRegex.exec($elt.attr("style")));
		if(!!t) translation = t;
		
		$.scrollTo({top: offset.top - position.top + translation.top - ((scrollOffset)?130:0), left: offset.left + translation.left }, {duration:700, easing:"swing", margin:true, onAfter: function(){}});
	}
	if(!Modernizr.csstransforms3d){
		cssTranslationRegEx = /left:\s*(\d+)px;\s*top:\s*(\d+)px/;
		setTimeout(scroll, 700);
	}else{
		scroll();
	}
};

plugin.setDetailView = function(element, item, detailMode, application){
	if(detailMode){
		element.addClass("detail");//.addClass(detailColCss);
		element.removeClass("fade20").removeClass("summary");
	}else{
		element.removeClass("detail").addClass("summary");//.removeClass(detailColCss);
	}
	//Releases Detail
	if(element.is(".a01-release")){
		var $releaseDetails = element.find(".productReleaseDetails"),
			$productImage = element.find(".productImage"),
			$article = element.find(".article_body");
		var spotifyUri = plugin.get(item, "a01.spotifyUri"),
			soundcloudId = plugin.get(item, "a01.soundcloudId"),
			soundcloudUrl = plugin.get(item, "a01.soundcloudUrl");
		if(detailMode){
			var $releasePlayer = element.find(".releasePlayer");
			if($releasePlayer.length > 0){
				if(!$productImage.data("showInDetail")){
					$productImage.hide();
				}
				$releasePlayer.show();
			}else if(!!spotifyUri){
				var $spotifyPlay = $(plugin.SpotifyEmbedTemplate.format( { uri:spotifyUri }));
				//$releaseDetails.append($spotifyPlay);
				$productImage.hide();
				$spotifyPlay.insertAfter($productImage);
				$article.addClass('clearfix');
			}else{
				var $scPlay;
				if(!!soundcloudUrl /*!!soundcloudId*/){
					$scPlay = $(plugin.SoundCloudEmbedHTML5.format( { soundcloud_url: soundcloudUrl })).css({"height":"180px"});
					//$scPlay = $(plugin.SoundCloudEmbedTemplate.format( { soundcloud_url: soundcloudUrl }));
					if( $productImage.find("img").is(".soundcloud-noart") /*|| isMobile */ ){
						$productImage.hide();
						$scPlay.css({"margin-bottom":"10px"}).insertAfter($productImage);
					}else{
						$productImage.data("showInDetail",true);
						$scPlay.css({"margin":"10px 0", "width":"340px"}).insertAfter($releaseDetails);
					}
				}else if(!!soundcloudId){
					$scPlay = $(plugin.SoundCloudEmbedTemplate_ID.format( { playlist_id: soundcloudId}));
					$productImage.hide();
					$scPlay.insertAfter($productImage);
				}
			}
		}else{
			//element.find(".releasePlayer").remove();
			element.find(".releasePlayer").hide();
			$productImage.css('display', 'inline');
		}
	}else if(element.is(".a01-bravado")){
		var $image = element.find("img.productImage"),
		$description = element.find(".productDescription"), 
		$vmore = element.find(".vertical-more");
		var _img = $image.attr("src"), _imgFull = $image.attr("data-src-full");
		if( detailMode && _img != _imgFull ){
			$image.attr("src", _imgFull);
			$image.load(function(){Echo.Broadcast.publish("Stream.Plugins.IsotopeVisualization.onRefresh", {}, application.config.data.contextId);});
		}
		var summary = $description.data("summary");
		if(detailMode){
			$vmore.css({"display":"none"});
		}else{
			setTimeout(function(){
				if($description.height() < $description.children("p").first().height()){
					$vmore.css({"display":"block"}); 
				}
			},0);			
		}
	}
};

plugin.Templates = {};

plugin.Templates.container =
	'<div class="echo-item-container">' +
		'<div class="echo-item-header">' +
			'<div class="echo-item-avatar"></div>' +
			'<div class="echo-item-authorName"></div>' +
			'<div class="echo-item-title"></div>' +
			'<div class="echo-item-topRightContent">'+
			'</div>'+
			'<div class="echo-item-timestamp">' +
				'<img class="echo-item-sourceIcon echo-clickable"/>' +
				'<div class="echo-item-date"></div>' +
				'<div class="echo-item-from"></div>' +
				'<div class="echo-item-via"></div>' +
			'</div>' +
			'<div class="echo-item-open"></div>' +
			'<div class="echo-item-close"></div>' +
		'</div>' +
		'<input type="hidden" class="echo-item-modeSwitch">' +
		'<div class="echo-item-wrapper">' +
			'<div class="echo-item-data">' +
				'<div class="echo-item-body echo-primaryColor"> ' + 
					'<span class="echo-item-text"></span>' +
					'<span class="echo-item-textEllipses">...</span>' +
					'<span class="echo-item-textToggleTruncated echo-linkColor echo-clickable"></span>' +
				'</div>' +
				'<div class="echo-item-commentCount"><span class="echo-item-a01-likes">Likes <div class="echo-item-voteButton no-expand" title="Like this!"><span class="echo-item-likesCount">0</span></div> </span><span class="echo-item-a01-separator"> &#8942; </span><span class="echo-item-a01-comments">Comments <span class="comment-icon" title="View Comments"><span class="echo-item-repliesCount">0</span></span></span>'+
				'<div class="echo-item-likes"></div>' +
				'</div>' +
			'</div>' +
			'<div class="echo-item-footer echo-secondaryColor echo-secondaryFont">' +
				/*'<img class="echo-item-sourceIcon echo-clickable"/>' +
				'<div class="echo-item-date"></div>' +
				'<div class="echo-item-from"></div>' +
				'<div class="echo-item-via"></div>' +*/
				'<div class="echo-item-controls"></div>' +
				'<div class="echo-clear"></div>' +
			'</div>' +
		'</div>' +
	'</div>';

plugin.SpotifyEmbedTemplate = '<div class="releasePlayer spotify"><iframe src="https://embed.spotify.com/?uri={uri}&view=coverart" width="300" height="380" frameborder="0" allowtransparency="true"></iframe></div>';
plugin.SpotifyButtonTemplate='<div class="spotifyBtn" title="Listen to: {title}"><span>Listen Now</span></div>';
plugin.SoundcloudButtonTemplate='<div class="soundcloudBtn" title="Listen to: {title}"><span>Listen Now</span></div>';
plugin.SpotifyLikeTemplate='<div class="fb-like" data-send="false" data-layout="button_count" data-width="90" data-show-faces="true"></div>';
//Soundcloud embed template with URL
plugin.SoundCloudEmbedHTML5 = '<div class="releasePlayer soundcloud"><iframe width="100%" height="180" scrolling="no" frameborder="no" src="http://w.soundcloud.com/player/?url={soundcloud_url}%3Fauto_play=false&amp;show_artwork=true&amp;color=F15A23"></iframe></div>';
plugin.SoundCloudEmbedTemplate = '<div class="releasePlayer soundcloud"><object height="300" width="300"> <param name="movie" value="https://player.soundcloud.com/player.swf?url={soundcloud_url}%3Fauto_play=false&amp;player_type=artwork&amp;color=F15A23"></param> <param name="allowscriptaccess" value="always"></param> <embed allowscriptaccess="always" width="300" height="400" src="https://player.soundcloud.com/player.swf?url={soundcloud_url}%3Fauto_play=false&amp;player_type=artwork&amp;color=F15A23" type="application/x-shockwave-flash"></embed> </object></div>';
//Legacy Playlist ID
plugin.SoundCloudEmbedTemplate_ID = '<div class="releasePlayer soundcloud"><object height="300" width="300"><param name="movie" value="http://player.soundcloud.com/player.swf?url=http%3A%2F%2Fapi.soundcloud.com%2Fplaylists%2F{playlist_id}%3Fplayer_type=artwork&amp;color=000000"> <param name="allowscriptaccess" value="always"><param name="wmode" value="transparent"> <embed allowscriptaccess="always" height="300" width="300" src="http://player.soundcloud.com/player.swf?url=http%3A%2F%2Fapi.soundcloud.com%2Fplaylists%2F{playlist_id}%3Fplayer_type=artwork&amp;color=000000" type="application/x-shockwave-flash"></object></div>';
//F15A23

plugin.BuyLinkTemplate = '<span class="echo-item-a01-separator"> &#8942; </span><span class="echo-item-bravado-buy no-expand"><a href="{url}" target="_blank" title="Buy {title}">Buy<span class="bravado-buy-icon"></span></a></span>';
plugin.BravadoTagTemplate = '<li class="{css}" >{tag}</li>';

plugin.css = "";

})(jQuery);
