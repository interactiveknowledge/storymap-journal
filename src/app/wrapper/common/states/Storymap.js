define([], function () {
  return function Storymap () {
    var show = function () {
      $('#menu').show();

      // Interaction Element
      $('#interaction').children().hide();
      $('.interaction__storymap').show();

      $('#info').children().hide();
      $('.info__storymap').show();
    }

    return {
      show: show
    }
  }
})