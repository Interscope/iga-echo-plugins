(function ($) {

    var plugin = Echo.createPlugin({
        "name": "FancyboxComments",
        "applications": ["Stream"],
        "init": function (plugin, application) {
			plugin.fancyTargets = plugin.config.get(application, "fancyTargets") || [".echo-item-container"];
			plugin.fancyContent = plugin.config.get(application, "fancyContent") || [".echo-item-body"];
            plugin.extendRenderer("Item", "container", plugin.renderers.Item.container, "FancyboxComments");
			if(Modernizr && Modernizr.csstransitions){
			//if(Modernizr && Modernizr.testProp && Modernizr.testProp('borderRadius')){
				plugin.css += plugin.css_fancybox;
			}
			plugin.addCss(plugin.css);
        }
    });
	
	plugin.renderers = { Item:{}};
	
    plugin.renderers.Item.container = function(element, dom) {
		var item = this;
		if(item.depth > 0 ) return;
		item.parentRenderer("container", arguments);
		var fancyTargets = plugin.fancyTargets.join(","),
			$fancyTargets = element.find(fancyTargets).add(element.closest(fancyTargets));
			$fancyTargets.css("cursor", "pointer");
		var fancyContent = plugin.fancyContent.join(","),
			$fancyContent = element.find(fancyContent).add(element.closest(fancyContent));
		$fancyTargets.click(function (e) {
			if(!$(e.target).is("a")){
				var content = "";
				$fancyContent.each(function(){
					var $elt = $(this), $tmp = $("<div>");
					$tmp.append($elt.clone());
					content += $tmp.html();
				});
				var $this = $(this);
				var permLink = item.data.object.id;
				var htmlContent = "<div id='fancybox-echo-wrapper'><div id='fancybox-echo-item-content'>" + content + "</div><div class='comments3ones'></div></div>";
				var loadComments = function () {
					var rtb = new RealTidbits.Comments({
						"target": $("#fancybox-inner .comments3ones"),
						"css": "/_global/css/3ones_comments.css",
						"appkey": "prod.umg",
						"socialSharing": {
							"appId": "khocbmhbelaifamoohjp", // janrain appid
							"xdReceiver": "/_global/rpx_xdcomm.html" // relative path to domain's  rpx_xdcomm.html file
						},
						"backplane": {
							"serverBaseURL": "https://backplane1.janrainbackplane.com/v1.2",
							"busName": "umg",
							"rpx": null
						},
						"targetURL": permLink,
						"streamQuery": commentQuery(permLink),
						"hideLogin": false, // remove default comment JanRain plugin
						"guestComments": false,
						"itemsPerPage": 15,
						"sanitize": {
							"tags": ["img", "object", "embed", "script", "iframe"], // remove html elements that match tags
							"externalLinks": true, // allow externals links (if they match a valid domain below)
							"validDomains": ["prod.umg.com", "umg.com", currentDomain, "youtube.com", "twitter.com", "facebook.com"],
							"types": ["email", "phone"]
						},
						"plugins": {
							"submit": [getUMGAuthPlugin()],
							"stream": []
						},
						"whirlpools": false,
						"richTextEditor": false,
						"emailSubscribe": true,
						"rssFeed": true,
						"CommunityFlag": true,
						"fileUploadServer": null
					});
					rtb._initStream = rtb.initStream;
					rtb.initStream = function(){
						this._initStream.call(this, arguments);
						this.streamClient.subscribe("Stream.onReady", function(){$("#fancybox-echo-wrapper .echo-auth-logout").hide();});
					}
					var $fancy = $("#fancybox-inner");
					var style = $fancy.attr("style");
					$fancy.attr("style", style.replace("overflow: auto;", "overflow-x: hidden; overflow-y:auto;"));
				};
				$.fancybox({ content: htmlContent, centerOnScroll: true, onComplete: loadComments });
				return false;
			}
		});
	};
	
	plugin.css = "#fancybox-echo-wrapper{min-width: 500px; max-width:800px; "+
			"height:"+$(window).height()*0.85+"px;"+
			"margin-right: 20px;"+
		"}"+
		"#fancybox-outer{border-radius: 8px;}"+
		"#fancybox-inner .echo-item-markers, #fancybox-inner .echo-item-tags{ display:none; }" +
		"#fancybox-inner .realtidbits-comments-content .realtidbits-comments-title{ margin: 0 0 10px 0; }" +
		"#fancybox-inner .realtidbits-comments-header{ display:none }" +
		"#fancybox-inner .echo-item-header{ border-bottom:solid 1px #C3C3C3; padding-bottom:3px; }" +
		"#fancybox-inner .echo-item-header .echo-item-avatar{ float:left; }" +
		"#fancybox-inner .echo-item-header .echo-item-authorName{ font-size:1.5em; margin:10px 8px; }" +
		"#fancybox-inner .echo-linkColor{ color:#524D4D; }" +
		"#fancybox-echo-item-content .echo-item-body{ font-size:1.4em; border-bottom:solid 1px #C3C3C3; margin:15px 10px 7px 10px; padding-bottom:7px;  }" +
		"#fancybox-inner .echo-item-body img{ display:none; }" +
		"#fancybox-inner .echo-item-media img{ margin:0px auto; display:block; margin:0px auto; max-width:500px; max-height:500px; float:none; }" +
		"#fancybox-inner .echo-item-media, #fancybox-inner .echo-item-body  { margin-top:10px; display:block; clear: both; }";
		;
	
	plugin.css_fancybox = "#fancybox-outer .fancy-bg{display:none;}" +
		"#fancybox-outer{border-radius: 8px;}" +
		"#fancybox-outer{box-shadow: 0 0 8px 3px #414141;}";
	
})(jQuery);
