define([], function () {
  this.getState = function () {
    return (ik.wrapper.state) ? ik.wrapper.state.get('wrapper-state') : 'attract';
  };

  this.getPrevState = function () {
    return (ik.wrapper.state) ? ik.wrapper.state.get('prev-wrapper-state') : false;
  }

  this.getBackground = function () {
    return ik.wrapper.layout[this.getState()].background;
  }

  this.getInfo = function () {
    return ik.wrapper.layout.state[this.getState()].section.info;
  }

  this.getInteraction = function () {
    return ik.wrapper.layout.state[this.getState()].section.interaction;
  }

  this.getBottom = function () {
    return ik.wrapper.layout.state[this.getState()].section.bottom;
  }

  // Set Data
  this.set = function (state, section, field, value) {
    if (section === 'background') {
      ik.wrapper.layout.state[state][section][field] = value;
    } else {
      ik.wrapper.layout.state[state].section[section][field] = value;
    }
  }

  // Manipulates the background.
  this.setBackground = function () {
    // Determine if the current state is using video
    let currentVideo = false;
    let currentVideoType = false;

    if (ik.wrapper.layout.state[this.getState()].background.video.src &&
      ik.wrapper.layout.state[this.getState()].background.video.src.length > 0) {
        currentVideo = ik.wrapper.layout.state[this.getState()].background.video.src;
        currentVideoType = ik.wrapper.layout.state[this.getState()].background.video.type;
      }

    if (this.getState() === 'region') {
      currentVideo = ik.wrapper.api.region.getRegionBackgroundVideo(ik.wrapper.state.get('regionid'));
      currentVideoType = ik.wrapper.api.region.getRegionBackgroundVideoType(ik.wrapper.state.get('regionid'));
    }

    if (currentVideo !== false && currentVideo.length > 0) {
      console.log(currentVideo)
      var nextVideoDiffers = false

      var imgNode = $('.fullscreen-bg__img');

      imgNode.hide();

      if (this.getPrevState())
        nextVideoDiffers = currentVideo !== ik.wrapper.layout.state[this.getPrevState()].background.video.src

      var video = $('#container video');

      if (ik.wrapper.state && ik.wrapper.state.get('video') === 'playing') {
        ik.wrapper.state.set('video', 'stopped');
      }

      var newSource = '<source src="' + currentVideo + '" type="' + currentVideoType + '">'
      video.append(newSource);

      if (nextVideoDiffers === true) {
        video.children().get(0).remove();
        video.load();
      }

      if (ik.wrapper.state) {
        ik.wrapper.state.set('video', 'playing');
      }

      video.show();
    } else if (ik.wrapper.layout.state[this.getState()].background.img.length) {
      if (ik.wrapper.state) {
        ik.wrapper.state.set('video', 'stopped');
      }

      var img = ik.wrapper.layout.state[this.getState()].background.img;

      var imgNode = $('.fullscreen-bg__img');

      imgNode.attr('src', img);

      imgNode.show();

      var video = $('#container video');

      video.hide();
    }
  }

  return this;
})