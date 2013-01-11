// Submit.Plugins.LinkUpload
// 
// Allows the user to attach media from, a link to a submission using Embed.ly to unwind media.
//
(function($) {
var plugin = Echo.createPlugin({
	"name": "LinkUpload",
	"applications": ["Submit"],
	"init": function(plugin, application) {
		application.config.get("target").addClass("echo-plugin-LinkUpload");

		plugin.extendTemplate("Submit", plugin.Templates.linkSubmit, "insertBefore", "echo-submit-post-container");
		plugin.extendTemplate("Submit", plugin.Templates.linkInputContainer, "insertAsLastChild", "echo-submit-body");
	
		plugin.extendRenderer("Submit", "linkSubmit", plugin.renderers.Submit.linkSubmit);
		plugin.listenEvents(application);
		plugin.addCss(plugin.css);
	}
});

plugin.addLabels({
	"buttonText": "Attach a Link",
	"uploadbuttonText": "Upload from Web",
	"error": "We're sorry, but an error occured attaching your link.",
	"noMediaFound": "<b>Media Not Found:</b> Please check the link and try again.",
	"processingText": " Processing...",
	"placeholderText": "Paste a link here..."
});

plugin.Templates = {};
plugin.Templates.linkSubmit = "<div class='echo-submit-linkSubmit'><a href='javascript:void(0);'>" + plugin.label("buttonText") + "</a></div>";
plugin.Templates.linkInputContainer = "<div class='echo-submit-link-input'><div class='echo-submit-linkInputContainer'><div class='echo-submit-linkInputWrapper' ><input type='text' name='echoLinkSubmit' class='linkInput' placeholder='"+plugin.label("placeholderText")+"'/></div></div><div class='echo-submit-linkSubmit-button echo-submit-ui-button'><a href='javascript:void(0);'>" + plugin.label("uploadbuttonText") + "</a></div><div class='echo-submit-linkPreviewContainer'></div></div>";
plugin.Templates.linkMediaWrapper = "<div class='echo-submit-linkMediaWrapper'></div>";

plugin.loadLink = function(element, dom, application){
	var $this = $(this)
	var link = $.trim($this.val());
	var preview = dom.get("linkPreviewContainer");
	// do not resolve the same link twice
	if (!link) {
		preview.empty().hide();
		plugin.set(application, "lastProcessedLink", "");
		plugin.set(application, "mediaContent", null);
		plugin.set(application, "mediaContentUrl", null);
		return;
	}
	if (plugin.get(application, "lastProcessedLink") == link) {
		return;
	}
	plugin.set(application, "lastProcessedLink", link);
	preview.show().html("<span class='echo-submit-link-processing echo-ui'><img src='http://cache.umusic.com/web_assets/_global/images/icons/spinning.gif' height='16px' width='16px' />"+plugin.label("processingText")+"</span>");
	$.get("http://api.embed.ly/1/oembed", {
		"url": link,
		"maxwidth": plugin.config.get(application, "mediaMaxWidth", 600),
		"format": "json",
		"wmode": "transparent",
		"allowscripts": false
	}, function(response) {
		preview.empty().removeClass("error"); //TODO: use .echo-submit-uploadedPhotos instead
		response = response || {};
		var $wrapper = $("<div class='echo-submit-linkMediaWrapper'></div>");
		var $text = dom.get("text");
		switch (response.type) {
			case "video":
				plugin.set(application, "mediaContent", response.html);
				plugin.set(application, "mediaContentUrl", response.url);
				$wrapper.append(response.html);
				preview.append($wrapper );
				if($text.val() == "")
					$text.val(response.title+" | "+response.description);
				break;
			case "photo":
				var img = '<img class="echo-file-upload-media" src="' + response.url + '" />';
				plugin.set(application, "mediaContent", img);
				plugin.set(application, "mediaContentUrl", response.url);
				$wrapper.append(img);
				preview.append($wrapper);
				$(".echo-submit-uploadedPhotos").append(img);
				if($text.val() == ""){
					var txt = "";
					if(!!response.title){ txt = response.title; }
					if(!!response.description){ txt += ((txt!="")?" | ":"")+ response.description; }
					$text.val(txt);
				}
				break;
			case "error":
				preview.append('<span class="echo-submit-linkInput-error">' + plugin.label('error') + '</span>');
				break;
			default:
				var $link = $("<a>"+link+"</a>").attr("href", link).attr("target", "_blank");
				plugin.set(application, "mediaContent", $('<span class="error"></span>').append($link).html());
				preview.append('<span class="echo-submit-linkInput-noMediaFound" style="display:block;">' + plugin.label('noMediaFound') + '</span>').addClass("error");
				//TODO: use .echo-submit-validation instead
		}
		if(response.type != "error"){
			application.publish("Submit.Plugins.LinkUpload.onLinkLoad", { data: response });
		}
		
	}, "jsonp");
};

plugin.clearLink = function(dom, application){
	var element = $(dom.content);
	plugin.set(application, "mediaContent", null);
	plugin.set(application, "mediaContentUrl", null);
	plugin.set(application, "lastProcessedLink", null)
	element.find(".echo-submit-linkPreviewContainer").empty().hide();
	element.find(".echo-submit-uploadedPhotos").empty();
	element.find(".echo-submit-linkInputWrapper input").val("");
}

plugin.renderers = { Submit:{} };
plugin.renderers.Submit.linkSubmit = function(element, dom){
	var application = this;
	element.find("a").click(function(ev){ dom.get("link-input").show();	});
	
	var $linkInput = dom.get("link-input").find("input.linkInput");
	
	$linkInput.blur(function(){ plugin.loadLink.call(this, element, dom, application); });
	$linkInput.keypress(function(ev){
		if(ev.keyCode == 13)
			plugin.loadLink.call(this, element, dom, application);
	});
	$linkInput.find(".echo-submit-linkSubmit-button").click(function(e){
		e.preventDefault();
		plugin.loadLink.call(this, element, dom, application);
	});
	
	element.bind("reset", function(){ plugin.clearLink(dom, application); });
	
};

plugin.listenEvents = function(application) {
	plugin.subscribe(application, "Submit.onPostInit", function(topic, args) {
		var content = plugin.get(application, "mediaContent", "");
		var contentUrl = plugin.get(application, "mediaContentUrl", "");	
		if(!!content){
			if(!!contentUrl){
				content = "<a href='"+contentUrl+"' target='_blank' >" + content + "</a>";
			}
			args.postData.content = "<div>"+content + "</div><div>" + args.postData.content+"</div>";
		}
	});
	plugin.subscribe(application, "Submit.onPostComplete", function(topic, args) {
		application.dom.get("linkPreviewContainer").hide();
		plugin.set(application, "mediaContent", "");
		plugin.set(application, "mediaContentUrl", "");
		var $linkInput = application.dom.get("link-input").find("input.linkInput");
		$linkInput.val("");
	});
};

plugin.css = ".echo-submit-linkSubmit {background-color: #F8F8F8; background: -moz-linear-gradient(top, #f8f8f8 0%, #ececec 100%); background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,#f8f8f8), color-stop(100%,#ececec)); background: -webkit-linear-gradient(top, #f8f8f8 0%,#ececec 100%); background: -o-linear-gradient(top, #f8f8f8 0%,#ececec 100%); background: -ms-linear-gradient(top, #f8f8f8 0%,#ececec 100%); background: linear-gradient(top, #f8f8f8 0%,#ececec 100%); filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='#f8f8f8', endColorstr='#ececec',GradientType=0 ); border: 1px solid #C6C6C6; border-radius: 2px 2px 2px 2px; display: block; float:left; margin-left:10px; padding: 3px 6px;  }" + 
".echo-submit-linkSubmit a { text-decoration: none; color: #555555 !important; font-size: 1em; }" +
".echo-submit-link-input{ margin-top:5px; }" + 
".echo-submit-linkPreviewContainer, .echo-submit-linkInputContainer{display:block; overflow: hidden; padding:7px 0; background-color:none; }" + 
".echo-submit-linkPreviewContainer, .echo-submit-link-input{display:none;}" +
".echo-submit-linkInputWrapper{ border:1px solid #D2D2D2; padding:0 4px 0 20px; background:url('http://cache.umusic.com/web_assets/_global/images/icons/image_link.gif') no-repeat; background-position:left center; background-color:#FFFFFF; }" +
".echo-submit-linkInputWrapper input[type='text']{ border:none; width: 100%; margin:0px; }" + 
".echo-submit-link-processing{ padding: 0ppx 4px; }" + 
".echo-submit-linkMediaWrapper{ max-height: 200px; max-width: 200px; padding: 6px; background-color:#FFFFFF; box-shadow: 0px 0px 2px 2px #919191;  }" + 
".echo-submit-linkMediaWrapper * { height: 100%; width: 100%;}" +
".echo-file-upload-media{width:100%;}";
})(jQuery);

// Submit.Plugins.SubmitValidation
// 
// Require login, comment, terms & conditions checkbox with error messages & success message
// 
(function ($) {
    var plugin = Echo.createPlugin({
        "name": "SubmitValidation",
        "applications": ["Submit"],
        "init": function (plugin, application) {
			plugin.extendTemplate("Submit", plugin.Templates.check, "insertAfter", "echo-submit-post-container");
			plugin.extendTemplate("Submit", plugin.Templates.validation, "insertAfter", "echo-submit-controls");
			
			plugin.extendRenderer("Submit", "postButton", plugin.renderers.Submit.postButton);
			var callbacks = plugin.config.get(application, "callbacks");
			if(callbacks){
				plugin.errorCallback = callbacks.error;
				plugin.acceptCallback = callbacks.accept;
			}
			var settings = plugin.config.get(application);
			$.extend(true, plugin.settings, settings );
			plugin.listenEvents(application);
			plugin.addCss(plugin.css);
        }
    });
	
	plugin.settings = { fancyboxCloseOnSubmit: false };
	
	plugin.addLabels({
		"postTandCs": "I accept the terms & conditions",
		"youMustAccept": "You must accept the terms & conditions",
		"youMustLogin": "You must login with your social network to post",
		"youMustEnterAComment": "You must enter a comment to post",
		"submissionSuccess": "Post successful"
	});
	
	plugin.errorCallback = plugin.errorCallback || function(dom, application, message){
		var $valid = dom.get("validation");
		$valid.html(message).show();
		$valid.removeClass("success").addClass("error");
		application.publish("Submit.Plugins.SubmitValidation.onPostError", { message: message });
	};
	
	plugin.acceptCallback = plugin.acceptCallback || function(dom, application){
		var $valid = dom.get("validation");
		$valid.removeClass("error").addClass("success");
		$valid.hide();
		application.publish("Submit.Plugins.SubmitValidation.onSuccess", { });
	};
	
	plugin.renderers = { Submit:{} };
	plugin.renderers.Submit.postButton = function(element, dom) {
		var application = this;
		var _handler = plugin.get(application, "postButtonHandler");
		if(!_handler ){
			var $text = dom.get("text");
			var permissions = plugin.config.get(application, "permissions", "forceLogin");
			var handler = function(ev){
				var $element = $(element);
				var $check = $element.closest(".echo-submit-controls").find(".echo-submit-check");
				if($check.length >= 0 && !$check[0].checked ){
					plugin.errorCallback(dom, application, plugin.label("youMustAccept"));
					ev.stopImmediatePropagation();
				}else if (application.config.get("mode") != "edit" && (permissions == "forceLogin" && !application.user.logged())) {
					plugin.errorCallback(dom, application, plugin.label("youMustLogin"));
				}else if ($text.val() == "") {
					plugin.errorCallback(dom, application, plugin.label("youMustEnterAComment"));
				}else{
					plugin.acceptCallback(dom, application);
				}
				setTimeout(function(){
					if(!!application.vars.FileUpload)
						application.vars.FileUpload.is_posting = false;
				}, 2000);
			}
			plugin.set(application, "postButtonHandler", handler);
		}
		element.unbind("click", handler).bind("click", handler);
		application.parentRenderer("postButton", arguments);
	};
	
	plugin.listenEvents = function(application) {
		plugin.subscribe(application, "Submit.onPostComplete", function(topic, args) {
			var $target = plugin.settings.target, modal = plugin.settings.modal;
			if(modal){
				$.fancybox.close();
			}else{
				var $valid = application.dom.get("validation");
				$valid.html( plugin.label("submissionSuccess") );
				$valid.show();
				setTimeout(function(){ $valid.fadeOut("slow"); }, 8000);
			}			
			if(!!$target && modal){
				$target.qtip({content:plugin.label("submissionSuccess"), hide:"unfocus", position:{my:"top center", at:"bottom center"}, style: { classes: "ui-tooltip-light ui-tooltip-rounded ui-tooltip-success" } } );
				$target.qtip("show");
				setTimeout(function(){$target.qtip("destroy");}, 8000);
			}
		});
	};
	
	plugin.Templates = {};
	plugin.Templates.check = "<div class='echo-submit-check-container'><input id='echo-submit-check' class='echo-submit-check' type='checkbox'/><label for='echo-submit-check' class='echo-submit-check-label echo-primaryFont echo-primaryColor'>"+ plugin.label("postTandCs") +"</label></div>";
	plugin.Templates.validation = "<div class='echo-submit-validation'></div>";
	plugin.Templates.checkbox = function(application){return "<div class='echo-submit-check-container'><input id='echo-submit-check-"+String(application.config.data.contextId).replace(".","-")+"' class='echo-submit-check' type='checkbox'/><label for='echo-submit-check-"+String(application.config.data.contextId).replace(".","-")+"' class='echo-submit-check-label echo-primaryFont echo-primaryColor'>"+ plugin.label("postTandCs") +"</label></div>";};
	plugin.Templates.validation = "<div class='echo-submit-validation'></div>";
	
	plugin.css = ".echo-submit-check-container { float:right;}"+
	".echo-submit-validation{display:block; color:#cc0000; font-weight:bold; margin:6px 0; }"+
	".echo-submit-validation{ display:none; }";
	
})(jQuery);


// Submit.Plugins.SubmitModalUI
// 
// Provides UI for a modal upload & submit form that walks the user through the process
// 
(function ($) {

    var plugin = Echo.createPlugin({
        "name": "SubmitModalUI",
        "applications": ["Submit"],
        "init": function (plugin, application) {
			var settings = plugin.config.get(application);
			$.extend(true, plugin.settings, settings );
			
			application.config.data.actionString = "";
			
			var renderer = function(name, item, element, dom) {
				plugin.renderers.Submit[name].apply(item,
					[element, dom, application]);
			};

			$.each(plugin.renderers.Submit, function(name) {
				plugin.extendRenderer("Submit", name, function(element, dom) {
					renderer(name, this, element, dom);
				});
			});
			
			
			plugin.extendTemplate("Submit", plugin.Templates.SigninPrompt, "insertAfter", "echo-submit-auth");
			plugin.extendTemplate("Submit", plugin.Templates.TextOnlySubmit, "insertBefore", "echo-submit-post-container");
			plugin.extendTemplate("Submit", plugin.Templates.UploadDifferent, "insertAsLastChild", "echo-submit-photoUploadContainer");
			
			plugin.listenEvents(application);
			plugin.addCss(plugin.css);
			
			//HACK to not destroy fancybox on login
			Echo.Auth.prototype.listenEvents = function() {
				var self = this;
				this.subscribe("internal.User.onInvalidate", function() {
				//$.fancybox.close();
				self.rerender();
				});
			};
			
        }
    });
	
	plugin.addLabels({
		"textonly-buttonText": "Text-Only Response",
		"placeholderText": "Add a title or supporting text..."
	});
	
	plugin.settings = { };

	plugin.renderers = { Submit:{} };
	plugin.renderers.Submit.controls = function(element, dom, application) {
		var application = this;
		application.parentRenderer("controls", arguments);
		element.find(".echo-submit-linkSubmit").click(function(){
			if(application.user.account.logged){
				plugin.view.attachlink(application);
			}
		});
		element.find(".echo-submit-textOnly").click(function(){
			if(application.user.account.logged){
				plugin.view.textonly(application);
			}
		});
	};
	
	plugin.listenEvents = function(application) {
		plugin.subscribe(application, "Submit.Plugins.LinkUpload.onLinkLoad", function(topic, args) {
			plugin.view.submitPhoto(application);
			_gaq.push(['_trackEvent', 'ModalSubmit', 'LinkUpload']);
		});
		plugin.subscribe(application, "Submit.Plugins.FileUpload.onUpload", function(topic, args) {
			plugin.view.submitPhoto(application);
			_gaq.push(['_trackEvent', 'ModalSubmit', 'FileUpload']);
		});
		
		plugin.subscribe(application, "Submit.onPostComplete", function(topic, args) {
			_gaq.push(['_trackEvent', 'ModalSubmit', 'Submission Complete']);
		});
		
		plugin.subscribe(application, "Submit.onRender", function(topic, args) {
			plugin.target = $(args.target);
			plugin.view.main(application);
		});
		plugin.subscribe(application, "Submit.onRerender", function(topic, args) {
			plugin.view.login();
		});
	};
	
	plugin.renderers.Submit.text = function(element, dom, application) {
		var application = this;
		application.parentRenderer("text", arguments);
		$(element).attr("placeholder", plugin.label("placeholderText"));
	};
	
	plugin.renderers.Submit.uploaddiff = function(element, dom, application) {
		var application = this;
		application.parentRenderer("uploaddiff", arguments);
		$(element).click(function(e){
			e.preventDefault();
			var $submit = $(dom.content)
			$submit.find(".echo-submit-upload-control-remove").click();
			$submit.find(".echo-submit-linkSubmit").trigger("reset");
			plugin.view.main(application);
		});
	};
	
	plugin.renderers.Submit.postButton = function(element, dom, application) {
		var application = this;
		application.parentRenderer("postButton", arguments);
		element.bind("click", function(){
			_gaq.push(['_trackEvent', 'ModalSubmit', 'PostButtonClick']);
		});
	}
	
	plugin.view = {};
	plugin.view.main = function(application){
		plugin.target.find(".echo-submit-body, .echo-submit-header, .echo-submit-auth, .echo-submit-signinprompt, .echo-submit-post-container, .echo-submit-check-container").hide();
		plugin.target.find(".echo-submit-upload-button-container, .echo-submit-linkSubmit, .echo-submit-textOnly").show();
		if(!application.user.account.logged){
			plugin.target.addClass("echo-user-loggedout");
			plugin.target.find(".echo-submit-signinprompt").show();
			plugin.target.find(".echo-upload-form .echo-upload-file-input").bind("click", function(e){
				if(!application.user.account.logged){
					e.preventDefault();
				}
			});
			_gaq.push(['_trackEvent', 'ModalSubmit', 'Not Loggedin', item.id]);
			Backplane.subscribe(function (backplaneMessage) {
				if (backplaneMessage.type == 'identity/login'){
					_gaq.push(['_trackEvent', 'ModalSubmit', 'Login', item.id]);
				}
			});
		}
		_gaq.push(['_trackEvent', 'ModalSubmit', 'MainView']);
	}
	
	plugin.view.textonly = function(application){
		plugin.target.find(".echo-submit-body, .echo-submit-post-container, .echo-submit-check-container").show();
		plugin.target.find(".echo-submit-upload-button-container, .echo-submit-linkSubmit, .echo-submit-textOnly, .echo-submit-photoUploadContainer, .echo-submit-markersContainer, .echo-submit-tagsContainer").hide();
		if(application.user.account.logged){
			plugin.view.login();
		}
	}
	
	plugin.view.attachlink = function(application){
		plugin.target.find(".echo-submit-body, .echo-submit-link-input").show();
		plugin.target.find(".echo-submit-content, .echo-submit-photoUploadContainer, .echo-submit-upload-button-container, .echo-submit-linkSubmit, .echo-submit-textOnly, .echo-submit-post-container, .echo-submit-check-container, .echo-submit-markersContainer, .echo-submit-tagsContainer").hide();
	}
	
	plugin.view.submitPhoto = function(application){
		plugin.target.find(".echo-submit-body, .echo-submit-content, .echo-submit-photoUploadContainer, .echo-submit-post-container, .echo-submit-check-container").show();
		plugin.target.find(".echo-submit-link-input, .echo-submit-upload-button-container, .echo-submit-linkSubmit, .echo-submit-textOnly, .echo-submit-markersContainer, .echo-submit-tagsContainer").hide();
		if(application.user.account.logged){
			plugin.view.login();
		}
		_gaq.push(['_trackEvent', 'ModalSubmit', 'SubmitFormView']);
	}
	
	plugin.view.login = function(application){
		plugin.target.find(".echo-submit-signinprompt").hide();
		plugin.target.removeClass("echo-user-loggedout");
	}
	
	plugin.Templates = {};
	plugin.Templates.SigninPrompt = "<div class='echo-submit-signinprompt'><a href=\"javascript:void(0);\" onclick=\"$({}).enableCapture('signinLink').click();\"><span class=\"signin-button\">Sign In</span> with your social network to enter</a></div>";
	plugin.Templates.UploadDifferent = '<a class="echo-submit-uploaddiff" href="#">Upload a different image?</a>';
	plugin.Templates.TextOnlySubmit = '<div class="echo-submit-textOnly echo-submit-ui-button"><a href="javascript:void(0);">' + plugin.label("textonly-buttonText") + '</a></div>';
	
	plugin.css = "";
	
})(jQuery);

Echo.Localization.extend({
	"Submit.post": "Submit",
	"Submit.posting": "Submitting...",
	"Submit.actionString": "Add a title or supporting text...",
	"Plugins.FileUpload.attachPhoto": "Upload a Photo",
	"RealTidbitsComments.actionString": " 11 Leave a comment...",
	"Plugins.LMKSubscription.actionString": " 55 Leave a comment...",
	"Plugins.SubmitValidation.submissionSuccess": "Your submission has been received and will be reviewed before appearing on this page. Check back soon!"
});