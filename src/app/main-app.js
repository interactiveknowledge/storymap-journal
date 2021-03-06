if (document.location.protocol == "file:") {
	$(document).ready(function() {
		$("#fatalError .error-title").html("Application loading failed");
		$("#fatalError .error-msg").html("The application has to be accessed through a web server. Consult user guide for detail.");
		$("#fatalError").show();
	});
}
else {
	var i18n = null;
	define.amd.jQuery = true;

	require([
			"dojo/i18n!./resources/tpl/viewer/nls/template.js?v=" + app.version,
			"dojo/i18n!commonResources/nls/core.js?v=" + app.version,
			"esri/urlUtils",
			"dojo/_base/lang",
			"dojo/dom",
			"app/custom-scripts",
			"lib-app/jquery",
			"dojo/ready"
		], function(
			i18nViewer,
			i18nCommonCore,
			urlUtils,
			lang,
			dom
		){
			i18n = i18nViewer;
			lang.mixin(i18n, i18nCommonCore);

			require([
					"storymaps/common/Core",
					"storymaps/tpl/core/MainView",
          "wrapper/common/Wrapper"
				], function(
					Core,
					MainView,
          Wrapper
				){
					if (app.isInBuilder) {
						require([
                "wrapper/common/Edit",
								"storymaps/common/builder/Builder",
								"storymaps/tpl/builder/BuilderView" ,
								"dojo/i18n!./resources/tpl/builder/nls/template.js?v=" + app.version,
								"dojo/i18n!commonResources/nls/media.js?v=" + app.version,
								"dojo/i18n!commonResources/nls/webmap.js?v=" + app.version,
								"dojo/i18n!commonResources/nls/mapcontrols.js?v=" + app.version,
                "esri/IdentityManager"
							], function(
                Edit,
								Builder,
								BuilderView,
								i18nBuilder,
								i18nCommonMedia,
								i18nCommonWebmap,
								i18nCommonMapControls,
                IdentityManager
							){
								lang.mixin(i18n, i18nBuilder);
								lang.mixin(i18n, i18nCommonMedia);
								lang.mixin(i18n, i18nCommonWebmap);
								lang.mixin(i18n, i18nCommonMapControls);

                console.log('set id manageer');
                ik.IdentityManager = IdentityManager;

								var builderView = new BuilderView(Core),
								mainView = new MainView(builderView);

								Core.init(mainView, Builder);
								Builder.init(Core, builderView);
                ik.wrapper = new Edit();

                var returnTrue = function () { return true; }
                var body = $('body');
                body.contextmenu(returnTrue);
                body.mousedown(returnTrue);
                body.on('selectstart', returnTrue);

                // Show only the storymap
                $('.fullscreen-bg').hide();
                $('#info').hide();
                $('#bottom').hide();
                $('.interaction__attract').hide();
                $('.interaction__storymap').show();
							}
						);
					}
					else {
            // Creates the Story Map
            if (configOptions.appid.length) {
              Core.init(new MainView());
            }

            // Renders the menu
            ik.wrapper = new Wrapper();
            ik.wrapper.init();

            var returnFalse = function () { return false; }
            var body = $('body');
            body.contextmenu(returnFalse);
            body.mousedown(returnFalse);
            body.on('selectstart', returnFalse);
					}
				}
			);
		}
	);
}
