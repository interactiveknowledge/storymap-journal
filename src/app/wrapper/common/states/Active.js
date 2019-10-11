define([
  'wrapper/utils/layout'
], function (
  layout
) {
  return function Active () {
    /**
     * Show active elements
     * Hide all others
     */
    var show = function () {
      layout.setBackground();

      $('#menu').children().hide();
      $('.menu__active').show();

      // Interaction Element
      $('#interaction').children().hide();
      $('.interaction__active').show();

      $('#info').children().hide();
      $('.info__active').show();

      $('#bottom').children().hide();
      $('.bottom__active').show();

      $('.menu__active [data-nav]').each(function (i, ele) {
        ik.wrapper.createLinks($(ele));
      });
    }

    return {
      init: init,
      show: show
    }
  }
});