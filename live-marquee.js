(function ($) {

    var plugin = Echo.createPlugin({
        "name": "LiveMarquee",
        "applications": ["Stream"],
        "init": function (plugin, application) {
			application.config.liveUpdates = false; //Enable liveupdates if possible.
			plugin.settings.timeout = plugin.config.get(application, "timeout") || plugin.timeout;
			plugin.settings.speed = plugin.config.get(application, "speed") || plugin.speed;
			var renderer = function(name, item, element, dom) {
				plugin.renderers.Item[name].apply(item,
					[element, dom, application]);
			};
			plugin.extendRenderer("Stream", "container", function(element, dom) {
				plugin.renderers.Stream.container.apply(this, [element, dom, application]);
			});
			
			plugin.extendRenderer("Item", "content", function(element, dom) {
				renderer("content", this, element, dom);
			});
			plugin.extendRenderer("Item", "body", function(element, dom) {
				renderer("body", this, element, dom);
			});
			
			plugin.listenEvents(application);
			plugin.addCss(plugin.css);
        }
    });
	
	plugin.settings = { timeout: 3000, speed: 600 };
	
	plugin.listenEvents = function(application) {
		
		application.subscribe("Stream.onReady", function(topic, data, contextId) {
			var $container = $(data.target).find(".echo-stream-container"), $body = $container.find(".echo-stream-body");
			function marquee( application){
				if(application.activities.state == "live"){
					$container.animate({
						scrollLeft: "+="+marquee.selected.position().left		
					}, plugin.settings.speed, "swing");
					var $next = marquee.selected.next();
					if($next.length == 0){
						marquee.selected = $(marquee.selected.siblings()[0]);
					}else{
						marquee.selected = $next;
					}
				}
				setTimeout( function(){marquee( application);}, plugin.settings.timeout);
			}
			marquee.selected = $body.find(".echo-item-content:first-child");
			setTimeout( function(){marquee(application);}, plugin.settings.timeout);			
		});
	};
	
	
	plugin.renderers = { Item:{}, Stream:{}};
	
	plugin.renderers.Stream.container = function(element, dom, application){
		this.parentRenderer("container", arguments);
		element.addClass("livemarquee");
	};
	
    plugin.renderers.Item.content = function(element, dom, application){
		var item = this;
		item.parentRenderer("content", arguments);
		
	};
	
	plugin.renderers.Item.body = function(element, dom, application) {
		var item = this;
		item.parentRenderer("body", arguments);
		
	};
	
	plugin.css = ".livemarquee.echo-stream-container{background:#f1f1f1; width:100%; overflow:hidden;}"+
	".livemarquee .echo-stream-header{display:none;}"+
	".livemarquee .echo-stream-more{float:right;display:none;}"+
	".livemarquee .echo-stream-body, .livemarquee .echo-item-content{max-height:100px;}" +
	".livemarquee .echo-stream-body{ float: left; margin-right: -30000px; padding-left: 20px;}" +
	".livemarquee .echo-item-content{float:left; width:300px;}";
	
	
})(jQuery);
