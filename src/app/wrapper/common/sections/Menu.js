define([
  'lib-build/tpl!../../tpl/sections/Menu/Active',
  'lib-build/tpl!../../tpl/sections/Menu/Storymap',
  'lib-build/tpl!../../tpl/sections/Menu/Explore',
  'lib-build/tpl!../../tpl/svg/leaf',
  'lib-build/tpl!../../tpl/svg/menu-back',
  'lib-build/tpl!../../tpl/svg/menu-next',
  'lib-build/tpl!../../tpl/svg/menu-back-es',
  'lib-build/tpl!../../tpl/svg/menu-next-es',
  'lib-build/tpl!../../tpl/svg/menu-language-en',
  'lib-build/tpl!../../tpl/svg/menu-language-es',
  'lib-build/tpl!../../tpl/svg/hamburger-button',
  'lib-build/tpl!../../tpl/svg/menu-skip',
  'lib-build/tpl!../../tpl/svg/menu-menu',
  'lib-build/tpl!../../tpl/svg/menu-menu-back',
  'lib-build/tpl!../../tpl/svg/menu-menu-es',
  'lib-build/tpl!../../tpl/svg/menu-menu-back-es'
], function (
  menuTplActive,
  menuTplStoryMap,
  menuTplExplore,
  menuTplLeafLogo,
  menuTplBack,
  menuTplNext,
  menuTplBackEs,
  menuTplNextEs,
  menuTplLanguageEn,
  menuTplLanguageEs,
  menuTplHamburger,
  menuTplSkip,
  menuTplMenu,
  menuTplMenuBack,
  menuTplMenuEs,
  menuTplMenuBackEs
) {
  return function Menu () {
    console.log('wrapper.common.Menu -- init');

    var render = function () {
      var currentState = ik.wrapper.state.get('wrapper-state');

      switch (currentState) {
        case 'active':
          this.renderActive();
          break;
        case 'explore':
          this.renderExplore();
          break;
        case 'storymap':
          this.renderStorymap();
          break;
        default: // attract screen
          this.renderStorymap();
      }
    }

    this.renderActive = function () {
      var currentLanguage = ik.wrapper.state.get('language');
      var alternateLanguage = currentLanguage === 'en' ? 'es' : 'en';
      var languageEn = menuTplLanguageEn({});
      var languageEs = menuTplLanguageEs({});
      var hamburger = menuTplHamburger({});
      var skip = menuTplSkip({});
      var skipEs = menuTplNextEs({});

      var title = 'Why LEAF Matters';

      if (currentLanguage === 'es') {
        title = 'Por qué es importante LEAF';
      }

      $('.menu__active').html(menuTplActive({
        anotherLanguage: alternateLanguage,
        buttonHamburger: skip,
        buttonHamburgerEs: skipEs,
        buttonHamburgerNav: 'nav',
        buttonHamburgerData: 0,
        buttonLanguageEn: languageEn,
        buttonLanguageEs: languageEs,
        color: '#C84107',
        language: currentLanguage,
        title: title
      }));
    }

    this.renderExplore = function () {
      $('.menu__explore').html(menuTplExplore({
        color: '#C84107'
      }))
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

      var leafLogo = menuTplLeafLogo({
        fill: ''
      });

      var menuBack = (currentLanguage === 'en') ? menuTplMenuBack({}) : menuTplMenuBackEs({});
      var menuNext = (currentLanguage === 'en') ? menuTplNext({}) : menuTplNextEs({});
      var languageEn = menuTplLanguageEn({});
      var languageEs = menuTplLanguageEs({});

      var hamburger = menuTplHamburger({});

      var hamburgerNav = "nav";
      var hamburgerData = "";

      if (ik.wrapper.state.get('version') === 'cdi') {
        hamburgerNav = "region";
        hamburgerData = ik.wrapper.state.get('regionid');
      }

      $('.menu__storymap').html(menuTplStoryMap({
        alternateId: alternateStorymapId,
        anotherLanguage: anotherLanguage,
        buttonBack: menuBack,
        buttonNext: menuNext,
        buttonLanguageEn: languageEn,
        buttonLanguageEs: languageEs,
        buttonHamburger: hamburger,
        buttonHamburgerNav: hamburgerNav,
        buttonHamburgerData: hamburgerData,
        color: storymap[0].theme.color.primary,
        language: currentLanguage,
        leafLogo: leafLogo,
        name: storymap[0].name
      }));
    }

    /**
     * Update the story map menu buttons.
     *
     * @param {*} first is first section
     * @param {*} last is last section
     */
    var updateStoryMapButtons = function (first = false, last = false) {
      if (first === true) {
        var menu = menuTplMenuBack({});
      } else {
        if (ik.wrapper.state.get('language') === 'en') {
          var menu = menuTplBack({});
        } else {
          var menu = menuTplBackEs({});
        }
      }

      $('button[data-nav=back]').html(menu);

      if (last === true) {
        if (ik.wrapper.state.get('language') === 'en') {
          var menu = menuTplMenu({});
        } else {
          var menu = menuTplMenuEs({});
        }
        $('button[data-nav=next]').html(menu);
      } else {
        if (ik.wrapper.state.get('language') === 'en') {
          var menu = menuTplNext({});
        } else {
          var menu = menuTplNextEs({});
        }

        $('button[data-nav=next]').html(menu);
      }
    }

    return {
      render: render.bind(this),
      updateStoryMapButtons: updateStoryMapButtons
    }
  }
});