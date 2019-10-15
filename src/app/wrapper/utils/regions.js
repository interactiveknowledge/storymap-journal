define([], function () {
  /**
   * Regions utility provides an API for setting
   * and retrieving region data in the application.
   */
  return function regions () {
    /**
     * Return a single region using the app id
     *
     * @param {string} appid
     * @return {Array[region]} array of regions, of length 0 or 1
     */
    var get = function (appid) {
      return ik.wrapper.regions.filter(function (region) {
        return (region.id == appid) ? region : false;
      })
    }

    /**
     * Get all regions
     *
     * @return {Array[region]} an array of regions
     */
    var getAll = function () {
      return ik.wrapper.regions.filter(function(x,y) {
        if (x.storymaps.length > 0) {
          return x;
        }
      });
    }

    /**
     * For CDI only: return the featured region
     * 
     * @return {Array[region]}
     */
    var getFeaturedRegion = function () {
      return ik.wrapper.regions.filter(function (region) {
        return region.featured === true;
      })
    }

    var getRegionBackgroundVideo = function(regionid) {
      var currentRegion = ik.wrapper.regions.filter(function (region) {
        return region.id == regionid;
      });

      return currentRegion[0].media.background_video;
    }

    var getRegionBackgroundVideoType = function(regionid) {
      var currentRegion = ik.wrapper.regions.filter(function (region) {
        return region.id == regionid;
      });

      return currentRegion[0].media.background_video_type;
    }


    return {
      get: get,
      getAll: getAll,
      getFeaturedRegion: getFeaturedRegion,
      getRegionBackgroundVideo: getRegionBackgroundVideo,
      getRegionBackgroundVideoType: getRegionBackgroundVideoType
    }
  }
});