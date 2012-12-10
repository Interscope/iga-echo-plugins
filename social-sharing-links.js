(function($) {
    
    var plugin = Echo.createPlugin({
        "name": "SocialSharingLinks",
        "applications": ["Stream"],
        "init": function(plugin, application) {
			var providers = plugin.config.get( application, "checklist");
			var renderer = function(name, item, element, dom) {
				plugin.renderers.Item[name].apply(item,
					[element, dom, {"application": application}]);
			};
			plugin.extendRenderer("Item", "sociallinks", function(element, dom) {
				renderer("sociallinks", this, element, dom);
			});
			
			var options = plugin.config.get(application),
				target = (!!options.target) ? options.target : "echo-item-controls";
			plugin.extendTemplate("Item", plugin.Templates.sharing, "insertAfter", target, "SocialSharingLinks");
			
			$.extend(true, plugin.settings, options );
			
			plugin.listenEvents(application);			
			plugin.addCss(plugin.css);
        }
    });
	
	plugin.settings = {sources:[]};
	
	plugin.listenEvents = function(application){
		Echo.Broadcast.subscribe("Stream.onReady", function(topic, data, contextId){
			if(typeof twttr !== "undefined" && !!twttr.widgets) { twttr.widgets.load(); }
			$(".echo-item-sociallinks-share .facebook").each(function(){
				if(typeof FB !== "undefined" && !!FB.XFBML){ FB.XFBML.parse(this); }
			});
			$(".echo-item-sociallinks-share .googleplusone").each(function(){
				if(typeof gapi !== "undefined" && !!gapi.plusone){ gapi.plusone.go(this); }
			});		
		}, application.config.data.contextId);
	};
	
	plugin.renderers = { Item: {} };
    plugin.renderers.Item.sociallinks = function(element, dom, extra) {
		var item = this;
		if(item.depth == 0){
			this.parentRenderer("sociallinks", arguments);
			// Cannot crawl AJAX url in this format #!p
			//var permaLink = window.location.protocol+"//"+window.location.host+"/default.aspx#!p="+item.data.object.id;
			//TO DO: filter by source.
			var $share = element.find(".echo-item-sociallinks-share");
			$share.append($(plugin.Templates.Links.Twitter.replace("{PermalinkUrl}", item.data.object.id)));
			$share.append($(plugin.Templates.Links.Facebook.replace("{PermalinkUrl}", item.data.object.id)));
			$share.append($(plugin.Templates.Links.GPlus.replace("{PermalinkUrl}", item.data.object.id)));
		}
    };

	plugin.Templates = { Links:{} };
	plugin.Templates.sharing = "<div class='echo-item-sociallinks echo-ui clearfix'><ul class='echo-item-sociallinks-share' ></ul></div>";
	plugin.Templates.Links.Twitter = "<li><span class='twitter'><a href='http://twitter.com/share' class='twitter-share-button' data-url='{PermalinkUrl}' data-count='horizontal' >Tweet</a></span></li>";
	plugin.Templates.Links.Facebook = "<li><span class='facebook'><fb:like href='{PermalinkUrl}' layout='button_count' show_faces='false' width='90'></fb:like></span></li>";
    plugin.Templates.Links.GPlus = "<li><span class='googleplusone'><g:plusone size='medium' href='{PermalinkUrl}'></g:plusone></span></li>";
	
	plugin.css = "ul.echo-item-sociallinks-share{ list-style-type:none; display:inline-block; } ul.echo-item-sociallinks-share ul{ padding:0px 8px; } ul.echo-item-sociallinks-share li{ float:left; height: 20px; } ul.echo-item-sociallinks-share span.twitter iframe{ max-width:100px; } ul.echo-item-sociallinks-share span.facebook span{padding-right:20px;}";
	
}(jQuery));