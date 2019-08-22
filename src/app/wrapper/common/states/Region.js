define([
  'wrapper/utils/layout'
], function (
  layout
) {
  return function Region () {
    /**
     * Show region elements
     * Hide all others
     */
    var show = function () {
      layout.setBackground();

      // Do not show the menu
      $('#menu').hide();

      // Interaction Element
      $('#interaction').children().hide();
      $('.interaction__region').show();

      $('#info').children().hide();
      $('.info__region').show();

      $('#bottom').children().hide();
    }

    /**
     * Initialize a slideshow for the regions__list
     */
    var initSlides = function () {
      var btnNext = document.querySelector('.region__controls__btn-next');
      var btnPrev = document.querySelector('.region__controls__btn-prev');
      var frame = document.querySelector('.region__list');
      var slides = Array.from(document.querySelectorAll('[class^="region__list__slide"]'));
      var currentIndex = 0;

      var transformFrame = function(multiplier) {
        frame.style.transform = `translateX(${-100 * multiplier}%)`;
      }

      var shiftNext = function() {
        // Remove the disabled property if it's on btnPrev
        btnPrev.removeAttribute('disabled');
        currentIndex++;
        if (currentIndex === slides.length - 1) {
          btnNext.setAttribute('disabled', true);
        }
        transformFrame(currentIndex);
      }

      var shiftPrev = function() {
        // Remove the disabled property if it's on btnNext
        btnNext.removeAttribute('disabled');
        currentIndex--;
        if (currentIndex === 0) {
          btnPrev.setAttribute('disabled', true);
        }
        transformFrame(currentIndex);
      }

      btnNext.addEventListener('click', shiftNext);
      btnPrev.addEventListener('click', shiftPrev);
    }

    return {
      show: show,
      initSlides: initSlides
    }
  }
});