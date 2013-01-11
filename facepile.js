(function($) {

var plugin = Echo.createPlugin({
	"name": "IsoFacepile",
	"applications": ["Stream"],
	"dependencies": [],
	"init": function(plugin, application) {
		var renderer = function(name, item, element, dom) {
			plugin.renderers.Item[name].apply(item,
				[element, dom, application]);
		};
		
		plugin.extendTemplate("Item", plugin.Templates.container, "replace", "echo-item-container");	
		
		//RENDERERS
		plugin.extendRenderer("Item", "avatar", plugin.renderers.Item.avatar);
		plugin.extendRenderer("Item", "content", function(element, dom) {
			renderer("content", this, element, dom);
		});
		plugin.extendRenderer("Item", "container", function(element, dom) {
			renderer("container", this, element, dom);
		});
		//plugin.listenEvents(application);
		plugin.addCss(plugin.css);
	}
});

plugin.query = "";

plugin.renderers = {Item: {}};

plugin.renderers.Item.avatar = function(element, dom, application) {
	var item = this;
	var avatar = item.parentRenderer("avatar", arguments);
	avatar.css("width","").css("height","");
	element.append(avatar);
	Echo.Plugins.SwitchArktanImage.switchImageSrc.call(item, element, dom, {application:application, renderer:"avatar"});
	return avatar;
};

plugin.renderers.Item.content = function(element, dom, application) {
	var item = this;
	element.addClass("facepile");
	item.parentRenderer("content", arguments);
	var qcnt = $("<div></div>").append($(item.data.object.content));
	qcnt.find("img,iframe,object").remove();
	var $avatar = element.find(".echo-item-avatar");
	
	element.mouseover(function(){
		element.qtip({
			show:"mouseover",
			content:{
				text: plugin.formatTemplateStr(plugin.qTipTemplate, {content: qcnt.html() , id:item.data.actor.id, author: item.data.actor.title})
			},
			style:{
				classes:"ui-tooltip-rounded ui-tooltip-light ui-tooltip-shadow"
			},
			position:{
				my:"top left",
				at:"bottom center",
				target: $avatar
			}
		});
		element.qtip("show");
	});
	element.mouseout(function(){
		element.qtip("destroy");
	});
};

plugin.renderers.Item.container = function(element, dom, application) {
	var item = this;
	item.parentRenderer("container", arguments);
};

plugin.renderers.Item.body = function(element, dom, application) {
	var item = this;
	item.parentRenderer("body", arguments);
};

plugin.formatTemplateStr = function(str, args) {
	for(var key in args) {
		str = str.replace(new RegExp('{' + key + '}', "g"), args[key]);
	}
	str = str.replace(/{\w+}/g, "");
	return str;
};

plugin.qTipTemplate = '<div class="echo-item-title"><a href="{id}" target="_blank" title="{author}" >{author}</a></div>{content}';

plugin.Templates = {};

plugin.Templates.container =
	'<div class="echo-item-container">' +
		'<input type="hidden" class="echo-item-modeSwitch">' +
		'<div class="echo-item-wrapper">' +
			'<div class="echo-item-data">' +
				'<div class="echo-item-body echo-primaryColor"> ' + 
					'<div class="echo-item-authorName"></div>' +
					'<div class="echo-item-avatar"></div>' +
					'<span class="echo-item-text"></span>' +
					'<span class="echo-item-textEllipses">...</span>' +
					'<span class="echo-item-textToggleTruncated echo-linkColor echo-clickable"></span>' +
				'</div>' +
				'</div>' +
			'</div>' +
			'<div class="echo-item-footer echo-secondaryColor echo-secondaryFont">' +
					'<img class="echo-item-sourceIcon echo-clickable"/>' +
					'<div class="echo-item-date"></div>' +
					'<div class="echo-item-from"></div>' +
					'<div class="echo-item-via"></div>' +
					'<div class="echo-item-controls"></div>' +
					'<div class="echo-clear"></div>' +
			'</div>' +
		'</div>' +
	'</div>';
	
plugin.css = ".facepile .echo-item-text, .facepile .echo-item-authorName{display:none;} .facepile .echo-item-avatar, .facepile .echo-item-avatar img{width:128px!important;height:128px!important;float:none; margin:0px;} .facepile .echo-item-body, .facepile .echo-item-data{padding:0px; margin:0px} .facepile.echo-item-content .echo-item-footer{margin:0 12px; padding:8px 0;} .facepile.echo-item-content{width:128px!important; margin:12px; padding:0px; background-color:transparent; border:none; box-shadow:none;}";	

})(jQuery);
