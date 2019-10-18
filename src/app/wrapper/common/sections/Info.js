define([
  'wrapper/utils/layout',
  'lib-build/tpl!../../tpl/sections/Info/Active',
  'lib-build/tpl!../../tpl/sections/Info/Attract',
  'lib-build/tpl!../../tpl/sections/Info/Explore',
  'lib-build/tpl!../../tpl/sections/Info/Nav',
  'lib-build/tpl!../../tpl/sections/Info/Region',
  'lib-build/tpl!../../tpl/sections/Info/Storymap'
], function (
  layout,
  infoActiveTpl,
  infoAttractTpl,
  infoExploreTpl,
  infoNavTpl,
  infoRegionTpl,
  infoStorymapTpl
) {
  return function Info () {
    var render = function () {
      var currentState = ik.wrapper.state.get('wrapper-state');

      switch (currentState) {
        case 'active':
          this.renderActive();
          break;
        case 'explore':
          this.renderExplore();
          break;
        case 'nav':
          this.renderNav();
          break;
        case 'region':
          this.renderRegion();
          break;
        case 'storymap':
          this.renderStorymap();
          break;
        default: // attract screen
          this.renderAttract();
      }
    }

    /**
     * Render Templates
     * Bind Javascript Events
     */

    this.renderActive = function () {
      var renderData = layout.getInfo();

      var currentLanguage = ik.wrapper.state.get('language');

      if (currentLanguage === 'en') {
        renderData.h1 = 'Why LEAF Matters';
        renderData.desc = 'Won\'t stars face given living you\'re wherein shall dry you unto so grass may seed divided after brought. Fill isn\'t called, divided that. Two morning had herb creature two. Very hath dominion fly she\'d herb. Them you grass. Air it beginning first saying divided he abundantly be in over fill.';
      } else {
        renderData.h1 = 'Por qué LEAF es importante';
        renderData.desc = 'Embarcaronse por fin a 5 de Diciembre de 1745, y el lunes 6 a las diez horas de dia, habiendo disparado la pieza de leva, se hicieron a la vela en nombre de Dios, con viento fresco, y salieron a ponerse en franquia en el amarradero, que dista tres leguas de Buenos Aires.';
      }

      $('.info__active').html(infoActiveTpl(renderData));
    }

    this.renderAttract = function () {
      $('.info__attract').html(infoAttractTpl(layout.getInfo()));
    }

    this.renderExplore = function () {
      $('.info__explore').html(infoExploreTpl(layout.getInfo()));
    }

    this.renderNav = function () {
      $('.info__nav').html(infoNavTpl(layout.getInfo()));
    }

    this.renderRegion = function () {
      // Region headers are the region info
      var values = layout.getInfo()
      var regionid = ik.wrapper.state.get('regionid');
      var region = ik.wrapper.api.region.get(regionid);

      values.h1 = region[0].name;
      values.h2 = region[0].translated;

      $('.info__region').html(infoRegionTpl(values));
    }

    this.renderStorymap = function () {
      var appid = ik.wrapper.state.get('appid');
      var storymap = ik.wrapper.api.storymap.get(appid);
      var template = layout.getInfo();
      template.background = storymap[0].theme.background;

      $('.info__storymap').html(infoStorymapTpl(template));
    }

    return {
      render: render.bind(this)
    }
  }
})