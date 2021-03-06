define([], function () {
  return function Storymap () {
    var show = function () {
      $('.fullscreen-bg').css('background-image', 'unset');

      ik.wrapper.state.set('video-mute', 1);

      $('#menu').children().hide();
      $('.menu__storymap').show();

      $('#menu [data-nav]').each(function(i, ele) {
        ik.wrapper.createLinks($(ele));
      })

      // Interaction Element
      $('#interaction').children().hide();
      $('.interaction__storymap').show();

      $('#info').children().hide();
      $('.info__storymap').show();

      $('#bottom').children().hide();
      $('.bottom__storymap').show();
    }

    return {
      show: show
    }
  }
})