define([
  'lib-build/tpl!../../tpl/sections/Interaction/Active',
  'lib-build/tpl!../../tpl/sections/Interaction/Attract',
  'lib-build/tpl!../../tpl/sections/Interaction/Nav',
  'lib-build/tpl!../../tpl/sections/Interaction/Region',
  'lib-build/tpl!../../tpl/sections/Interaction/Storymap',
  'lib-build/tpl!../../tpl/components/NavigationButton',
  'lib-build/tpl!../../tpl/tags/img',
  'lib-build/tpl!../../tpl/svg/leaf',
  'esri/arcgis/utils',
  "dojo/on",
  "lib-app/vimeo/vimeo"
], function (
  interactionActiveTpl,
  interactionAttractTpl,
  interactionNavTpl,
  interactionRegionTpl,
  interactionStorymapTpl,
  NavigationButton,
  imgTag,
  leafLogo,
  esriUtils,
  on,
  vimeo
) {
  return function Interaction () {
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
      var activeClass = '.interaction__active';

      $(activeClass).html(interactionActiveTpl());

      $(activeClass + ' [data-nav]').each(function (i,ele) {
        ik.wrapper.createLinks($(ele));
      });

      var iframe = document.querySelector('iframe');
      var player = new vimeo(iframe);


      player.on('ended', function () {
        setTimeout(function () {
          ik.wrapper.showNav();
        }, 1500)
      });

      player.setCurrentTime(0);

      player.enableTextTrack('en');

      player.play();

      ik.wrapper.player = player;
    }

    this.renderAttract = function () {
      var action = 'nav'
      targetId = 0;
      if (ik.wrapper.getVersion() === 'cdi') {
        var action = 'region';

        var featured = ik.wrapper.api.region.getFeaturedRegion();
        targetId = featured[0].id
      }

      $('.interaction__attract').html(interactionAttractTpl({
        action: action,
        targetId: targetId
      }));
    }

    this.renderNav = function () {
      var activeClass = '.interaction__nav';

      var version = ik.wrapper.state.get('version');

      var navObj = {
        en: '',
        es: ''
      };

      if (version === 'cdi') {
        navObj.en = 'Please Select:';
        navObj.es = 'Por favor seleccione';
      } else {
        navObj.en = 'Explore Our Areas of Focus:';
        navObj.es = 'Explorar nuestras áreas de foque';
      }

      $(activeClass).html(interactionNavTpl(navObj));

      var currentLanguage = ik.wrapper.state.get('language');

      // LG-67: Disable language nav switching for now
      if (currentLanguage !== 'en') {
        ik.wrapper.state.set('language', 'en');
        currentLanguage = 'en'
      }

      var alternateLanguage = (currentLanguage === 'en') ? 'es' : 'en';

      var action = '';
      var buttons = [];

      if (ik.wrapper.getVersion() === 'llc') {
        action = 'storymap'
        allStorymaps = ik.wrapper.api.storymap.getAll();
        buttons = ik.wrapper.api.storymap.getAllLanguage(currentLanguage, allStorymaps);
      } else {
        action = 'region'
        buttons = ik.wrapper.api.region.getAll();
      }

      // Create navigation buttons
      buttons.forEach(function (button, index) {
        var id = '';
        var buttonTitle = ''
        var buttonTitleAlt = ''
        var image = leafLogo({
          fill: button.theme.color.secondary
        });
        if (ik.wrapper.getVersion() === 'cdi') {
          id = button.id;
          buttonTitle = button.name;
          buttonTitleAlt = button.translated;
        } else {
          id = button.uuid;
          buttonTitle = button.titles.primary;
          buttonTitleAlt = button.titles.secondary;
        }

        colorText = '#fff';
        if (button.theme.color.primary === '#d8cfaf') {
          colorText = button.theme.color.secondary;
        }

        $('.nav__list').append(NavigationButton({
          action: action,
          alternate: buttonTitleAlt,
          alternateLanguage: alternateLanguage,
          colorPrimary: button.theme.color.primary,
          colorSecondary: button.theme.color.secondary,
          colorText: colorText,
          currentLanguage: currentLanguage,
          imgSrc: image,
          targetId: id,
          title: buttonTitle
        }));
      });

      // Set button to explore section
      var image = leafLogo({
        fill: '#533B27'
      });

      if (ik.wrapper.getVersion() === 'llc') {
        // Set up the back button
        $('.nav__list__explore').html([
          NavigationButton({
            action: 'explore',
            alternate: 'Explorar nuestra comunidad global',
            alternateLanguage: 'es',
            colorPrimary: '',
            colorSecondary: '',
            colorText: '#fff',
            currentLanguage: currentLanguage,
            imgSrc: '',
            targetId: '',
            title: 'Explore our Global Community'
          }),
          NavigationButton({
            action: 'active',
            alternate: 'Por qué LEAF es importante',
            alternateLanguage: 'es',
            colorPrimary: '',
            colorSecondary: '',
            colorText: '#fff',
            currentLanguage: currentLanguage,
            imgSrc: '',
            targetId: '',
            title: 'Video: Why LEAF Matters'
          }),
        ]);

        // $('.nav__list__explore').append(NavigationButton({
        //   action: 'explore',
        //   alternate: 'Explore nuestra comunidad global',
        //   alternateLanguage: 'es',
        //   colorPrimary: '#715035',
        //   colorSecondary: '#533B27',
        //   colorText: '#fff',
        //   currentLanguage: currentLanguage,
        //   imgSrc: image,
        //   targetId: ik.wrapper.layout.state.explore.section.interaction.map,
        //   title: 'Explore Our Global Community'
        // }));
      }

      // Bind events to links
      $(activeClass + ' [data-nav]').each(function(i, ele) {
        ik.wrapper.createLinks($(ele));
      });
    }

    this.renderRegion = function () {
      var activeClass = '.interaction__region';

      $(activeClass).html(interactionRegionTpl());

      var currentLanguage = ik.wrapper.state.get('language');

      // LG-67: Disable language nav switching for now
      if (currentLanguage !== 'en') {
        ik.wrapper.state.set('language', 'en');
        currentLanguage = 'en'
      }

      var alternateLanguage = (currentLanguage === 'en') ? 'es' : 'en';

      var action = 'storymap';
      var region = ik.wrapper.state.get('regionid');
      var regionInfo = ik.wrapper.api.region.get(region);

      var regionStorymaps = ik.wrapper.api.storymap.get(regionInfo[0].storymaps);
      var buttons = ik.wrapper.api.storymap.getAllLanguage(currentLanguage, regionStorymaps);

      if (ik.wrapper.getVersion() === 'cdi') {
        buttons.sort(function (a, b) {
          return a.weight - b.weight;
        });
      }

      if (buttons.length > 8) {
        $('.region__heading').hide();
      } else {
        $('.region__controls').hide();
      }

      /**
       * Loop through all buttons, rather than automatically appending to the list,
       * Create NavigationButtson with each and Append them to a group (slide) in quantities of 8
       */
      buttons.forEach(function (button, index) {
        // Create new slide(s) for each 8 buttons
        if (index % 8 === 0) {
          var slide = document.createElement('ul');
          var slideClass = `region__list__slide-${index / 8}`
          slide.classList.add(slideClass);
          // Append the slide to the region__list
          $('.region__list').append(slide);
        } else {
          // If we don't need a new slide, get the last one
          var slideClass = `region__list__slide-${Math.floor(index / 8)}`;
        }

        var alternate = 'es';
        if (button.relationships) {
          var alternateStorymap = ik.wrapper.api.storymap.get([button.relationships.id]);

          if (alternateStorymap.length === 1)
            alternate = alternateStorymap[0].name;
        }

        var image = leafLogo({
          fill: ''
        });
        if (ik.wrapper.getVersion() === 'cdi') {
          image = imgTag({
            src: button.theme.flag
          });

          if (alternate.length === 0) {
            alternate = '';
          }
        }

        colorText = '#fff';
        if (button.theme.color.primary === '#d8cfaf') {
          colorText = button.theme.color.secondary;
        }

        $(`.${slideClass}`).append(NavigationButton({
          action: action,
          alternate: button.titles.secondary,
          alternateLanguage: alternateLanguage,
          colorPrimary: button.theme.color.primary,
          colorSecondary: button.theme.color.secondary,
          colorText: colorText,
          currentLanguage: currentLanguage,
          imgSrc: image,
          targetId: button.uuid,
          title: button.titles.primary
        }));

        // Make region__list__controls background-color correct
        var controlBtns = document.querySelectorAll('[class^="region__controls__btn-"]');
        Array.from(controlBtns).forEach(btn => {
          btn.style.backgroundColor = button.theme.color.primary;
        })
      });

      // Set up the back button
      $('.region__list__back').html(NavigationButton({
        action: 'nav',
        alternate: 'Ver todas las zonas',
        alternateLanguage: 'es',
        colorPrimary: '',
        colorSecondary: '',
        colorText: '#fff',
        currentLanguage: currentLanguage,
        imgSrc: '',
        targetId: '',
        title: 'View all regions'
      }));

      // Bind events to links
      $(activeClass + ' [data-nav]').each(function(i, ele) {
        ik.wrapper.createLinks($(ele));
      });
    }

    this.renderStorymap = function () {
      var appid =ik.wrapper.state.get('appid');
      var storymapData = ik.wrapper.api.storymap.get(appid);
      $('.interaction__storymap').html(interactionStorymapTpl());
      reset(storymapData[0].id);
    }

    this.renderExplore = function () {
      var mapid = ik.wrapper.state.get('mapid');
      var popup = null;
      var container = $('#explore-map');

      // container.html('');

      // console.log(mapid, container[0]);
      // var map = esriUtils.createMap(mapid, container[0], {
      //   mapOptions: {
      //     slider: true,
      //     nav:false,
      //     logo: false
      //   }
      // }).then(function (response) {
      //   ik.map = response.map;
      // });
    }

    return {
      render: render.bind(this)
    }
  }
})