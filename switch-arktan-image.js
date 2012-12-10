(function ($) {

    var plugin = Echo.createPlugin({
        "name": "SwitchArktanImage",
        "applications": ["Stream"],
        "init": function (plugin, application) {
            plugin.extendRenderer("Item", "body", plugin.renderers.body, "SwitchArktanImage");
			plugin.extendRenderer("Item", "media", plugin.renderers.media, "SwitchArktanImage");
			plugin.addCss(plugin.css);
        }
    });
	
	plugin.microgrooveRegEx = /(http:\/\/\S+\/images\/local\/)(\d+)(\/[\w\-]+.\w{3,4})/i;
	plugin.tumblrRegEx = /(http:\/\/\d+.media.tumblr.com\/tumblr_\w+_)(\d+)(.\w{3,4})/i;
	plugin.fbPhotoRegEx = /(http:\/\/photos-\w\.\w{1,2}\.fbcdn.net\/[\w\d\-]+\/[\d_]+)(_[nqs])(\.\w{3,4})/i;
	plugin.fbProfileRegEx = /(http:\/\/profile\.\w{1,2}\.fbcdn\.net\/\S+\/[0-9_]+)(\w)(\.\w+)/i;
	plugin.fbExternalImgRegEx = /(http:\/\/external\.\w{1,2}\.fbcdn\.net\/safe_image\.php.+&url=)(\S+)/i;
	plugin.fbAppImgRegEx = /(http:\/\/platform\.\w{1,2}\.fbcdn\.net\/www\/app_full_proxy.php.+&src=)(\S+)/i;
	plugin.twitterProfileRegEx = /(http:\/\/\w+\.twimg\.com\/profile_images\/\d+\/)(.+)(_[a-zA-Z]+)(\.[a-zA-Z]{3,4})?/i;
	plugin.whoSayRegEx = /(http:\/\/media.whosay.com\/\d+\/\d+\_)(\w+)(\.\w{3,4})/i;
	plugin.littleMonstersRegEx = /(http:\/\/cdn.littlemonsters.com\/\w+\/\w+\_)(\d+)(\.\w{3,4})/i;
	plugin.flickrRegEx = /(http:\/\/farm\d+\.staticflickr\.com\/\d+\/\w+)(_\w)(\.\w{3,4})/i;
	plugin.amazonS3RegEx =/(http:\/\/[\w\d\.]+s3.amazonaws.com\/\/[\w\d]+)(_\w+)(\.\w{3,4})/i;
	
	plugin.switchImageSrc = function (element, dom, extra) {
		var item = this;
		item.parentRenderer(extra.renderer, arguments);
		
		if(item.depth === 0 && typeof(element)!= "undefined" && element !== null){
			var $elt = $(element);
			$elt.find("img").each(function(){
				var $img = $(this);
				var groups;
				var arktan = {display:"src", src:$img.attr("src"), full:$img.attr("data-src-full"), web:$img.attr("data-src-web"), mobile:$img.attr("data-src-mobile"), preview:$img.attr("data-src-preview") };
				var imgSrc = { src: $img.attr("src"), preview: $img.attr("data-src-preview"), mobile: $img.attr("data-src-mobile"), web: $img.attr("data-src-web"), full: $img.attr("data-src-full") };
				var $window = $(window), screenWidth = Math.min($window.width(), $window.height());
				if(screenWidth > 480){
					arktan.display = "web";
				}else{
					arktan.display = "mobile";
				}
				//$img.attr("height","");//Kill all inline heights (present in WP feeds)
				//if(!arktan.full && !arktan.web && !arktan.mobile && !arktan.preview){ //We don't have image sizes					
					groups = plugin.fbProfileRegEx.exec(arktan.src); //fb profile
					if(!!groups && groups.length == 4){
						$img.closest(".fb_metadata").hide();
						$img.hide();
					}
					groups = plugin.fbPhotoRegEx.exec(arktan.src);
					if(!!groups && groups.length == 4){//if a facebook photo, set web size to _n
						groups[2] = "_q";
						arktan.mobile = groups.slice(1).join("");
						groups[2] = "_n";
						arktan.web = groups.slice(1).join("");
						arktan.full = arktan.web;
						$img.closest(".fb_metadata").find(".metadata_title").hide();
					}
					groups = plugin.fbExternalImgRegEx.exec(arktan.src); //fb external image	
					if(!!groups && groups.length == 3){
						arktan.web = decodeURIComponent(groups[2]);
					}
					groups = plugin.fbAppImgRegEx.exec(arktan.src); // fb app image
					if(!!groups && groups.length == 3){
						arktan.web = decodeURIComponent(groups[2]);
					}
					groups = plugin.tumblrRegEx.exec(arktan.src);
					if(!!groups && groups.length == 4){
						groups[2] = "500";
						arktan.web = groups.slice(1).join("");
					}
					groups = plugin.twitterProfileRegEx.exec(arktan.src);
					if(!!groups && groups.length == 5){
						var twitGrps = groups.slice(1);
						twitGrps[2] = "_mini";
						arktan.preview = twitGrps.join("");
						twitGrps[2] = "_normal";
						arktan.mobile = twitGrps.join("");
						twitGrps[2] = "_reasonably_small";//_bigger
						arktan.web = twitGrps.join("");
						twitGrps[2] = "";
						arktan.full = twitGrps.join("");
					}
					groups = plugin.microgrooveRegEx.exec(arktan.src);
					if(!!groups && groups.length == 4){
						groups[2] = "500";
						arktan.web = groups.slice(1).join("");
					}
					groups = plugin.whoSayRegEx.exec(arktan.src);
					if(!!groups && groups.length == 4){
						groups[2] = "la";
						arktan.web = groups.slice(1).join("");
					}
					groups = plugin.littleMonstersRegEx.exec(arktan.src);
					if(!!groups && groups.length == 4){
						groups[2] = "700";
						arktan.web = groups.slice(1).join("");
					}
					groups = plugin.flickrRegEx.exec(arktan.src);
					if(!!groups && groups.length == 4){
						groups[2] = "_t";
						arktan.preview = groups.slice(1).join("");
						groups[2] = "_n";
						arktan.mobile = groups.slice(1).join("");
						groups[2] = "_z";
						arktan.web = groups.slice(1).join("");
						groups[2] = "_o";
						arktan.full = groups.slice(1).join("");
						$img.attr("height","").attr("width","");
					}
					groups = plugin.amazonS3RegEx.exec(arktan.src);
					if(!!groups && groups.length == 4){
						groups[2] = "_web";
						arktan.web = groups.slice(1).join("");
					}
				//}
				var ad = arktan[arktan.display];
				if( !!ad && ad != "" && arktan.src != ad ){
					$img.attr("data-src-orig", arktan.src);
					$img.attr("src", ad);
					$img.attr("data-src-size", ad);
					//$img.removeClass("metadata_image");
					$img.addClass("metadata_image_" + ad);
					$img.one("error", function(){arktanImgFallback(this);});
				}
				if(imgSrc.preview != arktan.preview){
					//$img.attr("lowsrc", arktan.preview);
					$img.attr("data-src-preview", arktan.preview);
				}
				if(imgSrc.mobile != arktan.mobile){
					$img.attr("data-src-mobile", arktan.mobile);
				}
				if(imgSrc.full != arktan.full){
					$img.attr("data-src-full", arktan.full);
				}
			});
		}
    };
	
	plugin.renderers = {};
	
    plugin.renderers.body = function(element, dom, extra) {
		extra = extra || {};
		extra.renderer = "body";
		plugin.switchImageSrc.call(this,element, dom, extra);
	};
	
	plugin.renderers.media =  function(element, dom, extra) {
		extra = extra || {};
		extra.renderer = "media";
		plugin.switchImageSrc.call(this,element, dom, extra);
	};
	
	function arktanImgFallback(img){
		var $img = $(img);
		var src = $img.attr("src"),
			orig = $img.attr("data-src-orig");
		$img.attr("src", orig);
	}
	
	//enforce size restrictions with max-height, max-width on img, forget about divs.
	plugin.css = ".echo-item-data .metadata_image_div, .echo-item-data .metadata{ float: none!important; width: 100%!important; max-width:100%; overflow:visible;}"+ // max-height:100% !important;
	"span.echo-item-text{float:none!important;}"+
	".echo-item-data .metadata{ margin-left:0px!important; margin-right:0px; }"+
	".echo-item-data .metadata_image{ box-sizing:border-box; -o-box-sizing:border-box; -moz-box-sizing:border-box; -webkit-box-sizing:border-box; width: inherit!important; max-width:100%; }"; // max-height:100%!important;
	
})(jQuery);