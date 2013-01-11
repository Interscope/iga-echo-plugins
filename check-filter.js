(function ($) {

    var plugin = Echo.createPlugin({
        "name": "CheckFilter",
        "applications": ["Stream"],
        "init": function (plugin, application) {
			var checklist = plugin.config.get( application, "checklist");
			for( var key in checklist){
				checklist[key].source = checklist[key].source.replace(/'/g,"");
				plugin.extendTemplate("Stream", plugin.Templates.toggle(key, checklist[key].text, application), "insertAsLastChild", "echo-stream-header");
				plugin.checkList[checklist[key].source.toLowerCase()+"check"] = (typeof(checklist[key].value) =="undefined") ? true : checklist[key].value ;
			}
			plugin.config.set( application, "checklist", checklist);
			plugin.extendRenderer("Item", "content",  function(element, dom) {
				plugin.renderers.Item.content.apply(this, [element, dom, {"application": application}]);
			});
			plugin.extendRenderer("Stream", "body", function(element, dom) {
				plugin.renderers.Stream.body.apply(this, [element, dom, {"application": application}]);
			});
			plugin.addCss(plugin.css);
        }
    });
	
	plugin.checkList = [];
	
	plugin.renderers = { Item:{}, Stream:{}};
	plugin.renderers.Stream.body = function(element, dom, extra){
		var item = this;
		item.parentRenderer("body", arguments);
		if(!dom) return;
		var $header = dom.get("header");
		var $body = dom.get("body");
		var checklist = plugin.config.get( extra.application, "checklist");
		for( var key in checklist){
			plugin.setEventHooks(key, checklist[key].source, checklist[key].uri, $header, $body, extra);
		}
	};
	
	plugin.setEventHooks = function(label, sourceName, uri, $header, $body, extra){
		$header.find(".echo-"+label+"check").click(function(ev){
			var checkListKey = sourceName.toLowerCase()+"check";
			plugin.checkList[checkListKey] = !plugin.checkList[checkListKey];
			var selector = ".echo-item-content[data-echo-source='"+sourceName.toLowerCase()+"']";
			if(uri){
				selector = ".echo-item-content[data-echo-source-uri*='"+uri.toLowerCase()+"']";
			}
			$body.find(selector).each(function(){
				if(plugin.checkList[sourceName.toLowerCase()+"check"] == true){
					$(this).slideDown("slow", function(){
						if(extra.application.vars.IsotopeVisualization){
						$(this).removeClass("isotope-hidden");
					}
					});
				}else if(plugin.checkList[sourceName.toLowerCase()+"check"] == false){
					$(this).slideUp("slow", function(){
						if(extra.application.vars.IsotopeVisualization){
							$(this).addClass("isotope-hidden");
						}
					});
				}
			});
			$body.find(selector).promise().done(function(){
				if(extra.application.vars.IsotopeVisualization){
					Echo.Broadcast.publish("Stream.Plugins.IsotopeVisualization.onRefresh", {}, extra.application.config.data.contextId);
				}
			});
		});
	};
	
    plugin.renderers.Item.content = function(element, dom, extra){
		var item = this;
		item.parentRenderer("content", arguments);
		if(item.depth == 0){
			element.attr("data-echo-source", item.data.source.name.toLowerCase());
			if(!!item.data.source.uri)
				element.attr("data-echo-source-uri", item.data.source.uri.toLowerCase());
			if(plugin.checkList[item.data.source.name.toLowerCase()+"check"] == false){
				element.hide();
			}
			/*if(!plugin.checkList["newscheck"] && item.data.source.name == location.host){
				element.hide();
			}*/
		}
	};
	
	plugin.Templates = {};
	plugin.Templates.toggle = function(name, text, application){
		var contextID = String(application.config.data.contextId).replace(".","-");
		return "<div class='echo-header-filter-container'><input checked id='echo-"+name+"check-"+contextID+"' class='echo-"+name+"check' type='checkbox'/><label for='echo-"+name+"check-"+contextID+"' class='echo-"+name+"check-label echo-primaryFont echo-primaryColor'>"+text+"</label></div>";
	};
		
	plugin.css = ".echo-twittercheck-label{ background:url('https://twitter.com/phoenix/favicon.ico') no-repeat; background-position:left center; padding-left:20px;}"+
	".echo-facebookcheck-label{ background:url('http://facebook.com/favicon.ico') no-repeat; background-position:left center; padding-left:20px;}"+
	".echo-newscheck-label{ background:url('http://cache.umusic.com/web_assets/_global/images/icons/newspaper.gif') no-repeat; background-position:left center; padding-left:20px;}"+
	".echo-header-filter-container{ display:inline; margin-right: 10px; }";
	
})(jQuery);
