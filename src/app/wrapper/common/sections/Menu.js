define([
  'lib-build/tpl!../../tpl/sections/Menu/Storymap',
  'lib-build/tpl!../../tpl/svg/leaf',
  'lib-build/tpl!../../tpl/svg/menu-back',
  'lib-build/tpl!../../tpl/svg/menu-language-en',
  'lib-build/tpl!../../tpl/svg/menu-language-es',
  'lib-build/tpl!../../tpl/svg/hamburger-button'
], function (
  menuTplStoryMap,
  menuTplLeafLogo,
  menuTplBack,
  menuTplLanguageEn,
  menuTplLanguageEs,
  menuTplHamburger,
) {
  return function Menu () {
    console.log('wrapper.common.Menu -- init');

    var render = function () {
      var currentState = ik.wrapper.state.get('wrapper-state');

      switch (currentState) {
        case 'storymap':
          this.renderStorymap();
          break;
        default: // attract screen
          this.renderStorymap();
      }
    }

    /**
     * Render Templates
     * Bind Javascript Events
     */
    this.renderStorymap = function () {
      var appid = ik.wrapper.state.get('appid');
      var storymap = ik.wrapper.api.storymap.get(appid);
      var currentLanguage = ik.wrapper.state.get('language');
      var alternateLanguage = currentLanguage === 'en' ? 'es' : 'en';
      var anotherLanguage = ik.wrapper.api.storymap.hasAlternateLanguage(appid);
      var alternateStorymap = "";
      var alternateStorymapId = "";

      if (anotherLanguage) {
        var alternateStorymap = ik.wrapper.api.storymap.getAlternateLanguage(storymap[0].relationships.id, alternateLanguage)
        alternateStorymapId = alternateStorymap[0].uuid;
      }

      var leafLogo = menuTplLeafLogo({});
      var menuBack = menuTplBack({});
      var languageEn = menuTplLanguageEn({});
      var languageEs = menuTplLanguageEs({});
      var hamburger = menuTplHamburger({});

      $('.menu__storymap').html(menuTplStoryMap({
        alternateId: alternateStorymapId,
        anotherLanguage: anotherLanguage,
        buttonBack: menuBack,
        buttonLanguageEn: languageEn,
        buttonLanguageEs: languageEs,
        buttonHamburger: hamburger,
        color: storymap[0].theme.color.primary,
        language: currentLanguage,
        leafLogo: leafLogo,
        name: storymap[0].name
      }));
    }

    return {
      render: render.bind(this)
    }
  }
});