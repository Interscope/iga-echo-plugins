(function ($) {

    var plugin = Echo.createPlugin({
        "name": "EchoContentExtend",
        "applications": ["Stream"],
        "init": function (plugin, application) {
			var settings = plugin.config.get(application);
			$.extend(true, plugin.options, plugin.defaults, settings );
			var renderer = function(name, item, element, dom) {
				plugin.renderers.Item[name].apply(item,
					[element, dom, application]);
			};
			$.each(plugin.renderers.Item, function(name) {
				plugin.extendRenderer("Item", name, function(element, dom) {
					renderer(name, this, element, dom);
				});
			});
            //plugin.extendRenderer("Item", "body", plugin.renderers.body, "EchoContentExtend");
			plugin.extendRenderer("Stream", "body", function(element, dom) {
				plugin.renderers.Stream.body.apply(this, [element, dom, application]);
			});
			plugin.addCss(plugin.css);
        }
    });
	
	plugin.defaults = {twitterAtReplies: true, textHashtags: false, thinglink: true,
		metadata:{ source: true, sourceuri:false, arktan:false, echo:false, media: true, likes:false, replies: false },
		likesCountCss: {
			"echo-likes-50": [0, 51],
			"echo-likes-200": [51, 201],
			"echo-likes-1000": [201, 1001]
		},
		repliesCountCss: {
			"echo-replies-10": [0, 11],
			"echo-replies-50": [11, 51],
			"echo-replies-200": [51, 201]
		},
		iframe:{ responsive:["youtube", "vimeo"] },
		youtube:{ modest:true, ytimg:false, params:{"wmode":"transparent"} }
	};
	plugin.options = {};
	
	plugin.youtubeModest =  {"autohide":1, "iv_load_policy":3, "modestbranding":1, "rel":0, "showinfo":0, "showsearch":0, "controls":2 };
	
	plugin.twitterAtLinkRegEx = /(@)(<a\s+class=['"]tweet-url\s+username[^>]*>)((.(?!\/a>))+)(<\/a>)/gi;
	plugin.textHashTagRegEx = /(#(\w+))(?!<\/a>|\w|\S*['"]|;)/gi;
	plugin.youTubeEmbedRegEx = /(https?:\/\/(?:www\.)?youtube.com\/embed\/([\w\-]+)\/?)(\?([^\s'"]*))?/gi;
	plugin.vimeoEmbed= /\S+vimeo.com\/video\/(\d+)/gi;
	plugin.domainRegEx = /https?:\/\/(www\.)?([\w]+)/i;//[\w\.]+
	
	plugin.renderers = { Item:{}, Stream:{} };
	
	plugin.renderers.Stream.body = function(element, dom, application){
		var item = this;
		item.parentRenderer("body", arguments);
		if(plugin.options.thinglink && !!element){
			element.addClass("neverThinglink");
		}
	};
	
	plugin.renderers.Item.content = function(element, dom, application){
		var item = this;
		item.parentRenderer("content", arguments);
		if(!application.isRootItem(this)){ return; }
		if (plugin.options.metadata) {
			if(item.depth > 0) return;
			if(plugin.options.metadata.source){
				var src = item.data.source.name.toLowerCase();
				element.attr("data-echo-source", src);
				element.addClass("echo-source-"+src.replace(/\s+/g, "").replace(/\./g, "-"));
				if(!!item.data.source.uri && plugin.options.metadata.sourceuri)
					element.attr("data-echo-source-uri", item.data.source.uri.toLowerCase());
			}
			if(plugin.options.metadata.echo){
				element.attr("data-echo-timestamp", item.timestamp);				
			}
			element.data("echoTimestamp", item.timestamp);	
			if(plugin.options.metadata.arktan){
				var arktanStreamRegEx = /id_(\w+)/;
				for(var i=0; i< item.data.object.context.length;i++){
					sMatch = arktanStreamRegEx.exec(item.data.object.context[i].uri);
					if(!!sMatch && sMatch.length > 1){
						element.attr("data-ark-stream-id", sMatch[1]);
						element.addClass("ark-stream-"+sMatch[1].replace(/_/g,"-"));
					}
				}
			}
			function _findRange( rmap, count) {
				return $.foldl("", rmap, function(range, acc, className) {
					if (count < range[1] && count >= range[0] )
						return (acc = className);
				});
			}
			if(plugin.options.metadata.likes){
				var lc = item.data.object.accumulators.likesCount || 0;
				element.attr("data-echo-likescount", lc);
				element.addClass(_findRange(plugin.options.likesCountCss, lc));
			}
			if(plugin.options.metadata.replies){
				var rc = item.data.object.accumulators.repliesCount || 0;
				element.attr("data-echo-repliescount", rc);
				element.addClass(_findRange(plugin.options.repliesCountCss, rc));
			}
		}
		if(plugin.options.thinglink){
			plugin.thinglink(item, element, dom, application);
		}
	};
	
    plugin.renderers.Item.body = function(element, dom, app){
		var item = this, options = plugin.options;
		if(options.twitterAtReplies){
			plugin.twitterAtReplies(item, element, dom, app);
		}
		if(options.textHashtags){
			plugin.textHashtags(item, element, dom, app);
		}
		plugin.youTubeEmbed(item, element, dom, app, options.youtube.modest);		
		item.parentRenderer("body", arguments);
		//Post-Render
		if(options.metadata.media) plugin.hasMedia(item, element, dom, app);
		plugin.iframeContent(item, element, dom, app);
	};
	
	//TEXT PARSING FUNCTIONS	
	plugin.twitterAtReplies = function(item, element, dom, app){
		var g = plugin.twitterAtLinkRegEx.exec(item.data.object.content);
		function _r(m){return m[2] + "@" + m[3] + m[5];}
		for(var i=0;i<10;i++){
			if(!!g && g.length === 6 ){
				item.data.object.content = item.data.object.content.replace(g[0],_r(g));
			}else{ break; }
			g = plugin.twitterAtLinkRegEx.exec(item.data.object.content);
		}
	};
	
	plugin.textHashtags = function(item, element, dom, app){
		var g = plugin.textHashTagRegEx.exec(item.data.object.content);
		function _r(m, c){
			return c.substring(0, m.index) + '<a class="tweet-url hashtag" href="http://twitter.com/search?q=%23'+m[2]+'">' + m[1] + '</a>' + c.substring(m.index+ m[0].length);
		}
		for(var i=0;i<10;i++){
			if(!!g && g.length === 3 ){
				item.data.object.content = _r(g, item.data.object.content);
			}else{ break; }
			g = plugin.textHashTagRegEx.exec(item.data.object.content);
		}
	};
	
	plugin.thinglink = function(item, element, dom, app){
		var meta_img = element.find("img.alwaysThinglink");
		if(meta_img.length === 0){
			var meta_link = element.find('div.metadata_image_div a.metadata_link[href*="http://www.thinglink.com/scene/"]');
			meta_img = meta_link.children("img");
			meta_img.addClass("alwaysThinglink");
		}
		if(meta_img.length > 0){
			element.addClass("thinglink-media");
			if(typeof(__thinglink) === "undefined" && $('script[src*="//cdn.thinglink"]').length === 0){
				window["__tlid"] = window["__tlid"] || "171026130319441920";
				setTimeout(function(){(function(d,t){var s=d.createElement(t),x=d.getElementsByTagName(t)[0];s.type='text/javascript';s.async=true;s.src='//cdn.thinglink.me/jse/embed.js';
x.parentNode.insertBefore(s,x);})(document,'script');},0);
			}
		}
	};
	
	plugin.youTubeEmbed = function(item, element, dom, app, modest){
		if(modest) {
			if(navigator.userAgent.indexOf("MSIE 8.0") == -1 && navigator.userAgent.indexOf("MSIE 7.0") == -1){
			$.extend(plugin.options.youtube.params, plugin.youtubeModest);
			}
		}
		//Add params to Youtube iframe embeds
		var g = plugin.youTubeEmbedRegEx.exec(item.data.object.content), q, p;
		function _r(m, q, c){
			var url = m[1], p = [], params = {};
			for(var j=0; j<q.length; j++){
				p = q[j].split("="); //get the params
				params[p[0]] = p[1];
			}
			$.extend(params, plugin.options.youtube.params);
			var k=0;
			for(var key in params){
				url +=((k===0) ? "?" : "&")+key+"="+params[key];
				k++;
			}
			return c.substring(0, m.index) + url + c.substring(m.index+ m[0].length);
		}
		for(var i=0;i<10;i++){
			if(!!g && g.length === 5 ){
				q = (!!g[4])? g[4].split("&") : ""; //get the querystring
				item.data.object.content = _r(g, q, item.data.object.content);
			}else{ break; }
			g = plugin.youTubeEmbedRegEx.exec(item.data.object.content);
		}
		
		element.find("object param:last-of-type").after('<param name="wmode" value="transparent" >');
	};
	
	//JQuery DOM FUNCTIONS
	//Find iframes and add a cssclass to .echo-item-content of .media-[domain]
	plugin.iframeContent = function(item, element, dom, app){
		var $iframe = element.find("iframe"), $container = $iframe, $content = element.parents(".echo-item-content");
		if($iframe.length === 0 ) return;
		var g = plugin.domainRegEx.exec($iframe.attr("src"));
		for(var i=0;i<10;i++){
			if(!!g && g.length === 3 && !!g[2] ){
				$content.addClass(g[2]+"-media");
				$iframe.addClass(g[2]+"-media-item");
				if(plugin.options.iframe.responsive.length > 0 ){
					var wl = false, r = plugin.options.iframe.responsive;
					for(var j=0; j< r.length; j++){
						if(r[j] == g[2]){ wl = true; break; }	
					}
					if(!wl) continue;
					//iframes from whitelisted domains maintain aspect ratio
					$content.addClass("video-media");
					$iframe.addClass("video-media-item");
					$container = plugin.responsiveIframe(item, element, dom, app, $iframe, g[2]);
				}
				if(plugin.options.youtube.ytimg && g[2] == "youtube" ){
					plugin.youTubeImage(item, element, dom, app, $iframe, $container);
				}
			}else{ break; }
			g = plugin.domainRegEx.exec($iframe.attr("href"));
		}
	};
	
	plugin.hasMedia = function(item, element, dom, app){
		if (plugin.options.metadata.media && app.isRootItem(this)) {
			var $text = element.find(".echo-item-text"),
				$images = $text.find("img"),
				$media = $text.find("iframe,object,embed");
			plugin.set(item, "hasMedia", !!$media.length);
			if(!!$media.length){
				element.parents(".echo-item-content").addClass("rich-media");
			}else if(!!$images.length){
				element.parents(".echo-item-content").addClass("img-media");
			}else if(!$images.length && !$media.length){
				element.parents(".echo-item-content").addClass("no-media");
			}
		}
	};
	
	plugin.responsiveIframe = function(item, element, dom, app, $iframe, domain){
		var height = $iframe.attr("height"), width = $iframe.attr("width"), aspectRatio = 0.6;
		try{ aspectRatio = Math.round(height / width); }catch(ex){}
		var $wrapper = $('<div class="iframeWrapper" ></div>');
		$wrapper.insertAfter($iframe);
		$iframe.remove();
		$wrapper.append($iframe);
		if(domain == "youtube"){ aspectRatio = 0.6; }		
		$wrapper.css({"padding-bottom": (aspectRatio*100) + "%"});
		return $wrapper;
	};
	
	plugin.youTubeImage = function(item, element, dom, app, $iframe, $container){
		var g = plugin.youTubeEmbedRegEx.exec($iframe.attr("src"));
		var ytid = g[2];
		var $img = $('<div class="video-img-container"><img src="http://i.ytimg.com/vi/'+ytid+'/sddefault.jpg" /><div class="overlay" title="Click to Watch"></div></div>');
		$img.insertAfter($container);
		$img.attr("data-youtube-id",g[2]);
		$container.remove();
		
		function showVid(){
			$iframe.attr("src",$iframe.attr("src")+"&autoplay=1");
			$container.insertAfter($img);
			$img.remove();
		}
		$img.find(".overlay").click(showVid);
		$img.error(showVid);
		var text = $("<div></div>").append($container);
		$img.data("media", text.html());
	};
	
	plugin.fancybox = function(item, element, dom, app, options){
		// images: false, video:true //youtube, vimeo, <video>
		// youtube requires ytimg (so clickable) check $().data("media") for embed
	};
	
	plugin.css = ".video-img-container{position:relative;} .video-img-container .overlay{position:absolute;height:100%;width:100%;z-index:2;top:0px;background: url('/_global/images/icons/playbtn.png') no-repeat center center; -webkit-opacity: 0.4; -moz-opacity: 0.4; -o-opacity: 0.4; opacity: 0.4; filter:progid:DXImageTransform.Microsoft.Alpha(opacity=40);cursor:pointer;} .video-img-container .overlay:hover{-webkit-opacity: 0.7; -moz-opacity: 0.7; -o-opacity: 0.7; opacity: 0.7; filter:progid:DXImageTransform.Microsoft.Alpha(opacity=70);} .iframeWrapper {position:relative;height:0;} .iframeWrapper iframe{ position:absolute;top:0;left:0; width:100%;height:100%!important; }"; 
	
})(jQuery);
