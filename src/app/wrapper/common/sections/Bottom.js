define([
  'lib-build/tpl!../../tpl/sections/Bottom/Active',
  'lib-build/tpl!../../tpl/sections/Bottom/Storymap',
], function (
  bottomActiveTpl,
  bottomStorymapTpl
) {
  return function Bottom () {
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
          // Do nothing
      }
    }

    /**
     * Render Templates
     * Bind Javascript Events
     */

    this.renderActive = function () {
      $('.bottom__active').html(bottomActiveTpl({}));
    }

    this.renderExplore = function () {
      // this.renderStorymap = function () {
      //   $('.bottom__explore').html(bottomStorymapTpl({
      //     title: 'Title',
      //     body: '<p>Body</p>'
      //   }));
      // }
    }

    this.renderStorymap = function () {
      var appid = ik.wrapper.state.get('appid');
      var storymap = ik.wrapper.api.storymap.get(appid);
      $('.bottom__storymap').html(bottomStorymapTpl({
        title: storymap[0].callout.title,
        body: storymap[0].callout.body
      }));
    }

    return {
      render: render.bind(this)
    }
  }
});