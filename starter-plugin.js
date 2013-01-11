(function($) {
// @see http://wiki.aboutecho.com/w/page/35191181/How%C2%A0To%C2%A0-%C2%A0Write%C2%A0a%C2%A0Plugin#Creatingthepluginskeleton
var plugin = Echo.createPlugin({
	"name": "StarterPlugin",
	"applications": ["Stream"], // Can also add "Submit"
	"init": function(plugin, application) {
		var renderer = function(name, item, element, dom) {
			plugin.renderers.Item[name].apply(item,
				[element, dom, application]);
		};
		plugin.extendTemplate("Item", plugin.Templates.container, "replace", "echo-item-container");		
		//Change text labels - @see http://wiki.aboutecho.com/w/page/30503112/Customizing%20Text%20Labels
		Echo.Localization.extend({
			"loading":" "
		}, "Stream");
		//Plugin options
		var options = plugin.config.get(application);
		$.extend(true, plugin.settings, options );
		
		//Add a template with a configureable target container 
		var target = (!!options.target) ? options.target : "echo-item-controls";
		plugin.extendTemplate("Item", plugin.Templates.widgetTemplate, "insertAfter", target, "StarterPlugin");
		
		//Add Renderers
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

plugin.settings = {};

// * Custom text labels
plugin.addLabels({
	"sayHello": "Hello World!"
});

// * Subscribe to Events such as, re-rendering, login, new items
//@see http://wiki.aboutecho.com/w/page/30181308/Echo+Application+-+Echo+Stream+Client#Eventcallbacks
plugin.listenEvents = function(application) {
	//If a new item has been received...
	application.subscribe("Stream.Item.onReceive", function(topic, data, contextId) {
		var hId = application.subscribe("Stream.Item.onRender", function(topic, data, contextId) {
			// handle rendering of new items
			application.unsubscribe("Stream.Item.onRender", hId);
		});
	});
	
	var eid = application.subscribe("Stream.onRender", function(topic, data, contextId) {
		application.unsubscribe("Stream.onRender", eid); // pass an id to only subscribe once.
	});
	
	application.subscribe("Stream.onRerender", function(topic, data, contextId) {
		
	});
};

//RENDERERS - named after echo- css classname ex. echo-item-expandChildren
plugin.renderers = {Item: {}, Stream: {}};

// * echo-stream-body
plugin.renderers.Stream.body = function(element, dom, application){
	var item = this;
	item.parentRenderer("body", arguments);
};

// * echo-item-content - outermost item wrapper
// element - JQuery element being rendered
// dom - the top level stream container element
// application - the current instance of Echo.Stream
plugin.renderers.Item.content = function(element, dom, application) {
	var item = this; // this - Echo object data being rendered
	item.parentRenderer("content", arguments); // call parent echo-item-content renderer
	if (application.isRootItem(this)) { // only handle top-level items (depth == 1)
		// Do Something
		plugin.doSomething(element, item);
	}
};

plugin.renderers.Item.body = function(element, dom, application) {
	var item = this;
	item.parentRenderer("body", arguments);
};

plugin.renderers.Item.sayHello = function(element, dom, application) {
	var item = this;
	item.parentRenderer("sayHello", arguments);
	if(item.user.logged()){ // NOTE: when a user logs in via backplane the Stream is re-rendered
		element.html("<h4>Hello "+item.user.account.accounts[0].username+"!</h4>");
	}
};

plugin.renderers.Item.starterwidget = function(element, dom, application) {
	var item = this;
	item.parentRenderer("starterwidget", arguments);
};

//FUNCTIONS
plugin.doSomething = function(element, item){
	element.prepend("<div><h3>Echo Starter Plugin</h3></div>");
};

//TEMPLATE: echo-item-container - If not modifying, remove.
plugin.Templates = {};
plugin.Templates.widgetTemplate = '<div class="echo-item-starterwidget">{widget}</div>'
plugin.Templates.container =
	'<div class="echo-item-container">' +
		'<div class="echo-item-header">' +
			'<div class="echo-item-avatar"></div>' +
			'<div class="echo-item-topContentWrapper">' +
				'<div class="echo-item-authorName echo-linkColor"></div>' +
				'<div class="echo-item-topRightContent">' +
					'<div class="echo-clear"></div>' +
				'</div>' +
				'<div class="echo-clear"></div>' +
			'</div>' +
			'<div class="echo-clear"></div>' +
		'</div>' +
		'<input type="hidden" class="echo-item-modeSwitch">' +
		'<div class="echo-item-wrapper">' +
			'<div class="echo-item-data">' +
				'<div class="echo-item-body echo-primaryColor"> ' + 
					'<span class="echo-item-sayHello"><h4>'+plugin.label("sayHello")+'</h4></span>'+/*Example of label use in a template*/
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

//CSS: 
plugin.css = "";	

})(jQuery);
