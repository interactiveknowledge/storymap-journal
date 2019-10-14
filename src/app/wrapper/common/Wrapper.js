define([
  "lib-build/css!lib-app/font-awesome/css/font-awesome.min",
  'lib-build/tpl!./Wrapper',
  'lib-build/css!../styles/main',
  'dojo/topic',
  'dojo/Stateful',
  '../utils/api',
  '../utils/regions',
  '../utils/storymaps',
  './states/Active',
  './states/Attract',
  './states/Explore',
  './states/Nav',
  './states/Region',
  './states/Storymap',
  './sections/Info',
  './sections/Interaction',
  './sections/Menu',
  './sections/Bottom',
  'lib-build/tpl!../tpl/components/IdleModal',
  'esri/IdentityManager',
  "dojo/on",
  "esri/arcgis/utils"
], function(
  fontAwesomeCss,
  wrapperTpl,
  mainCss,
  topic,
  Stateful,
  apiUtil,
  regionUtil,
  storymapUtil,
  Active,
  Attract,
  Explore,
  Nav,
  Region,
  Storymap,
  Info,
  Interaction,
  Menu,
  Bottom,
  tplIdleModal,
  IdentityManager,
  on,
  esriUtils
) {
  return function Wrapper() {

    var version = app.indexCfg.ik.version

    ik.IdentityManager = IdentityManager;

    // Have a wrapper state
    var state = new Stateful();

    // Initialize Utilities
    var apiStorymap = new storymapUtil();
    var apiRegion = new regionUtil();

    // Global Wrapper Data
    var layout = {};
    var storymaps = {};
    var regions = {};
    var idle = {
      current: 0,
      interval: 1000,
      warning: 105,
      reset: 120
    };
    var storymapCount = 0;

    // State controllers
    var active = {};
    var attract = {};
    var explore = {};
    var nav = {};
    var region = {};
    var storymap = {};

    // Wrapper sections
    var info = {};
    var interaction = {};
    var menu = {};
    var bottom = {};

    if (window.visitor) {
      window.visitor.set('uid', window.user)
    }

    var init = function() {
      console.log('wrapper.common.Wrapper - init');

      /**
       * Set the current version of the kiosk
       */
      this.version = version;

      /**
       * Grab data
       */
      apiUtil.init();

      /**
       * Initialize State and Section classes
       */

      // State controllers
      this.states.active = new Active();
      this.states.attract = new Attract();
      this.states.explore = new Explore();
      this.states.nav = new Nav();
      this.states.region = new Region();
      this.states.storymap = new Storymap();

      // Wrapper sections
      this.sections.info = new Info();
      this.sections.interaction = new Interaction();
      this.sections.menu = new Menu();
      this.sections.bottom = new Bottom();

      /**
       * When app starts set the first states.
       */
      this.states.attract.init();

      this.state = state;

      this.state.set('version', this.version);

      this.state.set('language', 'en');

      this.state.set('wrapper-state', 'attract');

      this.state.set('prev-wrapper-state', 'attract');

      this.state.set('rendering', false);

      this.state.set('navigation-history', []);

      /**
       * appid watcher.
       * Kick off necessary methods here if the storymap has changed but wrapper-state has not.
       */
      this.state.watch('appid', function() {
        console.debug('AppId changed to ' + state.get('appid'));
      })

      /**
       * regionid watcher.
       */
      this.state.watch('regionid', function () {
        console.debug('RegionID changed to ' + state.get('regionid'));
      })

      /**
       * Wrapper state watcher. Handles wrapper navigation.
       * Passes current state to section renderers.
       */
      this.state.watch('wrapper-state', function () {
        console.log('Current wrapper state:', ik.wrapper.state.get('wrapper-state'));

        // Kick of the rendering lifecycle
        ik.wrapper.state.set('rendering', true);

        // Set the state as a container class
        $('#container').removeClass(ik.wrapper.state.get('prev-wrapper-state'));
        $('#container').addClass(ik.wrapper.state.get('wrapper-state'));

        // Render the appropriate sections
        switch (ik.wrapper.state.get('wrapper-state')) {
          case 'attract':
          case 'nav':
          case 'region':
            ik.wrapper.sections.info.render();
            ik.wrapper.sections.interaction.render();
            break;
          case 'active':
          case 'explore':
          case 'storymap':
            ik.wrapper.sections.info.render();
            ik.wrapper.sections.menu.render();
            ik.wrapper.sections.interaction.render();
            ik.wrapper.sections.bottom.render();
            break;
          default:
            // nothing
        }

        // End rendering lifecycle
        ik.wrapper.state.set('rendering', false);
      })

      /**
       * Section render lifecyle state watcher.
       */
      this.state.watch('rendering', function () {
        if (ik.wrapper.state.get('rendering') === true) {
          // Begin Render
          console.log('Render period begins');
          // Adjust our transition overlay
          var overlay = document.querySelector('.transition-overlay');
          // Grab/prevent all touch events with the overlay until things are loaded
          overlay.style.pointerEvents = 'all';
          overlay.style.transition = 'unset';
          overlay.style.opacity = 1;
        } else {
          // Adjust our transition overlay
          var overlay = document.querySelector('.transition-overlay');
          setTimeout(function () {
            overlay.style.transition = 'opacity ease 0.75s';
            overlay.style.opacity = 0;
          }, 150);
          // Buttons/etc can be touched 1.5 seconds after render
          setTimeout(function () {
            overlay.style.pointerEvents = 'none';
          }, 1500);

          // End Render
          console.log('Render period ends', ik.wrapper.states);
          ik.wrapper.states[ik.wrapper.state.get('wrapper-state')].show();
          // Init slideshow funtionality here if its a region screen
          if (ik.wrapper.state.get('wrapper-state') === 'region') {
            ik.wrapper.states[ik.wrapper.state.get('wrapper-state')].initSlides();
          }

          // Increase volume and opacity of bgVideo until 1(00%)
          var bgVideo = $('.fullscreen-bg video').get(0);
          bgVideo.volume = 0;
          bgVideo.style.opacity = 0;
          var fadeInterval = setInterval(function() {
            if (bgVideo.volume + 0.05 <= 1) {
              bgVideo.volume = bgVideo.volume + 0.05;
              bgVideo.style.opacity = parseFloat(bgVideo.style.opacity) + 0.05;
            } else {
              clearInterval(fadeInterval);
              bgVideo.volume = 1;
              bgVideo.style.opacity = 1;
            }
          }, 100);

          var bgImg = $('.fullscreen-bg__img').get(0);
          bgImg.style.opacity = 0;
          var imgFadeInterval = setInterval(function () {
            if (bgImg.style.opacity < 1) {
              bgImg.style.opacity = parseFloat(bgImg.style.opacity) + 0.05;
            } else {
              clearInterval(imgFadeInterval);
              bgImg.style.opacity = 1;
            }
          }, 100)

        }
      });

    /**
     * Background video and sounds watcher.
     */
    this.state.watch('video', function () {
      var bgVideo = $('.fullscreen-bg video').get(0);

      switch (ik.wrapper.state.get('video')) {
        case 'playing':
          if (bgVideo.muted) {
            bgVideo.muted = false;
          }

          if (bgVideo.paused) {
            bgVideo.play();
          }
          break;
        case 'stopped':
          bgVideo.pause();
          break;
        case 'muted':
          if (!bgVideo.muted) {
            bgVideo.muted = true;
          }
          break;
        case 'unmuted':
          if (bgVideo.muted) {
            bgVideo.muted = false;
          }
          break;
        default:
          break;
      }
    })

    /**
    * Temporary script to hook up our play and mute toggle buttons for development
    */
    var initVideoToggleButtons = function() {
      var muteToggle = document.getElementById('mute-toggle');
      var playToggle = document.getElementById('play-toggle');
      var reload = document.getElementById('reload');

      muteToggle.addEventListener('click', function() {
        if (ik.wrapper.state && ik.wrapper.state.get('video') !== 'muted') {
          ik.wrapper.state.set('video', 'muted');
          $(muteToggle).addClass('active');
        } else {
          ik.wrapper.state.set('video', 'unmuted');
          $(muteToggle).removeClass('active');
        }
      });
      playToggle.addEventListener('click', function() {
        if (ik.wrapper.state && ik.wrapper.state.get('video') !== 'stopped') {
          ik.wrapper.state.set('video', 'stopped');
          $(playToggle).addClass('active');
        } else {
          ik.wrapper.state.set('video', 'playing');
          $(playToggle).removeClass('active');
        }
      });
      reload.addEventListener('click', function () {
        window.location.reload();
      });
    }
    initVideoToggleButtons();

    /**
     * Watch state change of wrapper language
     */
    this.state.watch('language', function () {
      switch(ik.wrapper.state.get('language')) {
        case 'en':
          $('#container').removeClass('es');
          $('#container').addClass('en');
          break;
        case 'es':
          $('#container').removeClass('es');
          $('#container').addClass('es');
          break;
        default:
          break;
      }
    });

    var resetIdleTimer = function () {
      // Analytics
      if (ik.wrapper.idle.current > ik.wrapper.idle.warning && ik.wrapper.idle.current < ik.wrapper.idle.reset) {
        ik.wrapper.analytics.event('Kiosk', 'Idle Timeout Canceled', 'User has cancelled the idle timer.');
      }

      ik.wrapper.idle.current = 0;
      $('#idle-modal').hide();
    }

    document.getElementsByTagName('body')[0].addEventListener('click', resetIdleTimer);
    document.getElementsByTagName('body')[0].addEventListener('touch', resetIdleTimer);

    setInterval(function () {
      if (ik.wrapper.state.get('wrapper-state') !== 'attract') {
        ik.wrapper.idle.current += ik.wrapper.idle.interval / 1000;
      } else {
        ik.wrapper.idle.current = 0;
      }

      if (ik.wrapper.idle.current > ik.wrapper.idle.warning) {
        if (ik.wrapper.getVersion() === 'cdi') {
          var featured = ik.wrapper.api.region.getFeaturedRegion();
          targetName = featured[0].machine_name.toLowerCase();
          $('#idle-modal').addClass(ik.wrapper.getVersion() + '-' + targetName);
        }

        var timeLeft = ik.wrapper.idle.reset - ik.wrapper.idle.current;

        $('#idle-modal').html(tplIdleModal({
          timeLeft: timeLeft
        }));

        $('#idle-modal').show();
      } else {
        $('#idle-modal').hide();
      }

      if (ik.wrapper.idle.current > ik.wrapper.idle.reset) {
          ik.wrapper.idle.current = 0;
          $('#idle-modal').hide();
          var version = ik.wrapper.getVersion();

          if (getUrlVar('username') && getUrlVar('password')) {
            var username = getUrlVar('username');
            var password = getUrlVar('password');
            window.location.href = `http://localhost:3000/?version=${version}&username=${username}&password=${password}`;
          } else {
            window.location.href = `http://localhost:3000/?version=${version}`;
          }
      }
    }, ik.wrapper.idle.interval);

    ik.wrapper.topic.subscribe('story-navigate-section', function (e) {
      if (e === app.data.getStoryLength() - 1) {
        $('#button-next').attr('class', 'fade');
      } else {
        $('#button-next').attr('class', '');
      }
    });

    /** Initialize the map listening events for LLC since it requires login */
    if (this.version === 'llc') {
      // Get Credentials.
      if ( app.indexCfg.username && app.indexCfg.password) {
        on(ik.IdentityManager, 'dialog-create', function(){
          on(ik.IdentityManager.dialog, 'show', function(){
            ik.IdentityManager.dialog.txtUser_.set('value', app.indexCfg.username);
            ik.IdentityManager.dialog.txtPwd_.set('value', app.indexCfg.password);
            ik.IdentityManager.dialog.btnSubmit_.onClick();
          });
        });
      }

      var container = $('#explore-map');

      container.html('');

      console.log(ik.wrapper.layout.state.explore.section.interaction.map);
      
      ik.wrapper.state.set('mapid', ik.wrapper.layout.state.explore.section.interaction.map);

      var map = esriUtils.createMap(ik.wrapper.layout.state.explore.section.interaction.map, container[0], {
        mapOptions: {
          slider: true,
          nav:false
        }
      }).then(function (response) {
        ik.map = response.map;
      });
    }

    if (getUrlVar('state') === 'storymap' && getUrlVar('id')) {
      if (getUrlVar('region')) {
        ik.wrapper.state.set('regionid', getUrlVar('region'));
      }

      if (getUrlVar('lang')) {
        ik.wrapper.state.set('language', getUrlVar('lang'));
      }

      ik.wrapper.showStorymap(getUrlVar('id'), 1);
    }
  } // End init()

    /**
     * Public methods, avail globally, which set the wrapper state.
     */
    this.showActive = function () {
      ik.wrapper.analytics.pageView('/active', 'Active Screen');

      ik.wrapper.state.set('prev-wrapper-state', ik.wrapper.state.get('wrapper-state'));
      ik.wrapper.state.set('wrapper-state', 'active');
    }

    this.showAttract = function () {
      ik.wrapper.analytics.pageView('/attract', 'Attract Screen');

      ik.wrapper.state.set('prev-wrapper-state', ik.wrapper.state.get('wrapper-state'));
      ik.wrapper.state.set('wrapper-state', 'attract');
    }

    this.showExplore = function (mapid) {
      console.log(mapid);
      ik.wrapper.analytics.pageView('/explore', 'Explore Screen');

      ik.wrapper.state.set('prev-wrapper-state', ik.wrapper.state.get('wrapper-state'));

      if (ik.wrapper.state.get('mapid') !== mapid) {
        ik.wrapper.state.set('mapid', mapid);
      }

      ik.wrapper.state.set('wrapper-state', 'explore');
    }

    this.showNav = function () {
      ik.wrapper.analytics.pageView('/main-navigation', 'Main Story Map Navigation Screen');

      ik.wrapper.state.set('prev-wrapper-state', ik.wrapper.state.get('wrapper-state'));
      ik.wrapper.state.set('wrapper-state', 'nav');
    }

    this.showRegion = function (regionid) {
      // Analytics
      ik.wrapper.analytics.pageView('/region-navigation', 'Region Story Map Navigation Screen');

      var currentState = ik.wrapper.state.get('wrapper-state');
      if (currentState === 'nav') {
        ik.wrapper.analytics.event('Kiosk', 'Main Menu Region Selected', 'The user has selected a region from the main menu of the CDI.');
      }

      ik.wrapper.state.set('prev-wrapper-state', currentState);
      if (ik.wrapper.state.get('regionid') !== regionid) {
        ik.wrapper.state.set('regionid', regionid);
      }

      ik.wrapper.state.set('wrapper-state', 'region');
    }

    this.showStorymap = function (appid, pageReload = 0) {
      // Analytics
      ik.wrapper.analytics.pageView('/storymap', 'Story Map');
      if (ik.wrapper.getVersion() === 'cdi') {
        var featuredRegion = ik.wrapper.api.region.getFeaturedRegion();
        var currentRegion = ik.wrapper.state.get('regionid');

        if (parseInt(featuredRegion) !== parseInt(currentRegion)) {
          ik.wrapper.analytics.event('Kiosk', 'Non-featured Region Story Map', 'This story map is from a region which was not featured by the kiosk.');
        }
      }


      if (pageReload === 0 && ik.wrapper.storymapCount > 14 && window.ipcRenderer) {
        var regionid = ik.wrapper.state.get('regionid')
        var version = ik.wrapper.getVersion();
        var lang = ik.wrapper.state.get('language');
        ipcRenderer.send('navigate-new-window', `http://localhost:3000/?version=${version}&state=storymap&region=${regionid}&id=${appid}&lang=${lang}`);
      } else {
        ik.wrapper.state.set('prev-wrapper-state', ik.wrapper.state.get('wrapper-state'));
        if (ik.wrapper.state.get('appid') !== appid) {
          ik.wrapper.state.set('appid', appid);
        }

        ik.wrapper.state.set('wrapper-state', 'storymap');
      }

      ik.wrapper.storymapCounter();
    }

    this.getVersion = function () {
      return this.version;
    }

    this.storymapCounter = function () {
      if (ik.wrapper.storymapCount > 14) {
        console.log('Warning: Story Map count is', ik.wrapper.storymapCount);
      }

      ik.wrapper.storymapCount += 1;
    }

    /**
     * During section render this function will pass click() events
     * to elements with recognized data attributes.
     */
    var createLinks = function (element) {
      var data = element.data();
      var state = data.nav;

      switch (state) {
        case 'back':
          element.click(_.throttle(function (e) {
            e.preventDefault();

            var index = app.data.getCurrentSectionIndex();
            if (index === 0) {
              var region = ik.wrapper.state.get('regionid');
              if (region !== undefined && region > 0) {
                ik.wrapper.showRegion(region);
              } else {
                // Analytics
                ik.wrapper.analytics.event('Kiosk', 'Kiosk Navigation', 'View All Regions');

                ik.wrapper.showNav();
              }
            } else {
              // Analytics
              ik.wrapper.analytics.event('Story Map', 'Story Map Navigation Back', 'The user has navigated back one section in the story map.');
              ik.wrapper.topic.publish('story-navigate-section', index - 1);
            }
          }, 1000));
          break;
        case 'next':
          element.click(_.throttle(function (e) {
            e.preventDefault();

            var index = app.data.getCurrentSectionIndex();

            var length = app.data.getStoryLength();

            if (index + 1 < length) {
              // Analytics
              ik.wrapper.analytics.event('Story Map', 'Story Map Navigation Next', 'The user has navigated next one section in the story map.');

              ik.wrapper.topic.publish('story-navigate-section', index + 1);
            }
          }, 1000));
          break;
        case 'first':
          element.click(function (e) {
            e.preventDefault();

            var index = app.data.getCurrentSectionIndex();

            if (index > 0) {
              ik.wrapper.topic.publish('story-navigate-section', 0);
            }
          });
          break;
        case 'active-language':
          element.click(function (e) {
            e.preventDefault();

            var language = $('.menu__active__wrapper__buttons__language').data('language') || null;

            if (language) {
              ik.wrapper.state.set('language', language);

              // Update captions
              ik.wrapper.player.enableTextTrack(language);
            }

            // Re-render sections
            ik.wrapper.sections.info.render();
            ik.wrapper.sections.menu.render();

            $('.menu__active [data-nav]').each(function (i, ele) {
              ik.wrapper.createLinks($(ele));
            });
          });
          break;
        default:
          var showState = 'show' + state.charAt(0).toUpperCase() + state.slice(1);
          var option = data[data.nav] || null;

          // Optionally check to see if language state should be changed
          var language = data.language || null;

          element.click(function (e) {
            e.preventDefault();

            if (language) {
              ik.wrapper.state.set('language', language);
            }

            ik.wrapper[showState](option);
          })
      }
    }

    this.event = function (category, action, label = null, path = null) {
      if (window.visitor) {
        window.visitor.event({
          ec: category,
          ea: action,
          el: label,
          dp: path
        }).send()
      }
    }

    this.pageView = function (path, title) {
      if (window.visitor) {
        window.visitor.pageview({
          dp: path,
          dt: title,
          ds: window.user
        }).send()
      }
    }

    return {
      api: {
        storymap: apiStorymap,
        region: apiRegion
      },
      analytics: {
        event: this.event,
        pageView: this.pageView
      },
      init: init,
      createLinks: createLinks,
      getVersion: this.getVersion,
      layout: layout,
      regions: regions,
      idle: idle,
      sections: {
        bottom: bottom,
        info: info,
        interaction: interaction,
        menu: menu
      },
      showActive: this.showActive,
      showAttract: this.showAttract,
      showExplore: this.showExplore,
      showNav: this.showNav,
      showRegion: this.showRegion,
      showStorymap: this.showStorymap,
      states: {
        active: active,
        attract: attract,
        explore: explore,
        nav: nav,
        region: region,
        storymap: storymap
      },
      storymaps: storymaps,
      storymapCount: storymapCount,
      storymapCounter: this.storymapCounter,
      topic: topic
    }
  }
});
