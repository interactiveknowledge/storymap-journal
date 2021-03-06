// Node API
const fs = require('fs')
const os = require('os')
const path = require('path')
const url = require('url')

// Installed packages
const axios = require('axios')
const jsona = require('jsona')
const _ = require('lodash')

// Set up Jsona
const { Jsona } = jsona
const formatter = new Jsona()

// Set up local paths for files
const localFilesPath = require("os").homedir() + '/.storymap-kiosk'

if (fs.existsSync(localFilesPath) === false) {
  fs.mkdirSync(localFilesPath, { recursive: true })
}

const apiPath = localFilesPath + '/api'

if (fs.existsSync(apiPath) === false) {
  fs.mkdirSync(apiPath, { recursive: true })
}

const staticPath = path.join(__dirname, '../static')

if (fs.existsSync(staticPath) === false) {
  fs.mkdirSync(staticPath, { recursive: true })
}

const downloadPath = localFilesPath + '/download'

if (fs.existsSync(downloadPath) === false) {
  fs.mkdirSync(downloadPath, { recursive: true })
}

const storymapTemplate = {
  id: "",
  uuid: "",
  name: "",
  language: "",
  weight: 0,
  theme: {
    background: "",
    color: {
      primary: "",
      secondary: ""
    }
  },
  titles: {
    primary: "",
    secondary: ""
  },
  callout: {
    title: "",
    body: ""
  },
  relationships: {
    id: ""
  }
}

const regionTemplate = {
  id: '',
  machine_name: '',
  name: '',
  featured: false,
  translated: '',
  storymaps: [],
  theme: {
    color: {
      primary: '',
      secondary: ''
    }
  }
}

/**
 * capture the image derivatives from the response data and append it 
 * to the JSONa object which does not process meta objects
 *
 * @param {Object[Jsona]} jsona 
 * @param {Object[JSONAPI response]} response
 */
const appendImageDerivatives = (jsona, response) => {
  if (!Array.isArray(jsona)) {
    return
  }
  jsona.forEach((a) => {
    if (a.field_media) {
      const c = response.included.filter(b => b.id === a.field_media.id)

      if (c.length === 1) {
        const d = c[0].relationships.image.data.meta.derivatives
        jsona.map(e => {
          if (e.field_media.id === a.field_media.id) {
            e.field_media.meta = d
          }

          return e
        })
      }
    }
  })
}

/**
 * getHeader - returns title data for the Info section
 *
 * @param {[Object]} content
 * @param {[String]} field
 * @return {[String]}
 */
const getHeader = (content = {}, field = '') => {
  if (process.env.KIOSK_VERSION === 'cdi' || field.indexOf('field_state_explore') === 0) {
    if (field.indexOf('field_state_storymap') === 0) {
      return ''
    }

    if (_.isEmpty(_.get(content, field, content.title)) === true) {
      return content.title
    } else {
      return _.get(content, field, content.title)
    }
  }

  return ''
}

/**
 * Take JSON object and write it to path
 *
 * @param {String} path 
 * @param {Object} json 
 */
const writeJsonToFile = (path = '', json = {}) => {fs.writeFileSync(path, JSON.stringify(json, null, 2), 'utf8')}

/**
 * Take a pathname from Drupal, download the file if possible.
 * Return the remote or local pathname.
 *
 * @param {[String]} fileuri
 * @return {[String]}
 */
const setFile = (fileuri) => {
  if (fileuri.indexOf(staticPath) === 0) {
    return fileuri.replace(staticPath, '/static')
  }

  fileuri = process.env.BACKEND_URL + fileuri

  const absFilepath = downloadPath + decodeURIComponent(url.parse(fileuri).pathname)
  const relFilepath = '/dynamic/download' + decodeURIComponent(url.parse(fileuri).pathname)

  if (fs.existsSync(path.dirname(absFilepath)) === false) {
    fs.mkdirSync(path.dirname(absFilepath), { recursive: true })
  }

  axios({
    method: 'GET',
    url: fileuri,
    responseType: 'stream'
  })
    .then((res) => {
      const writeStream = fs.createWriteStream(absFilepath)

      writeStream.on('open', () => {this.event.emit('add-file')})

      // Use setTimeout to let other files begin downloading before emitting event
      writeStream.on('close', () => {setTimeout(() => {this.event.emit('remove-file')}, 500)})

      res.data.pipe(writeStream)
    }).catch(error => {
      this.event.emit('build-error', error)
    })

  return relFilepath
}

/**
 * Sets data to a layout.json object and writes the stringify object to file
 *
 * @param {[Object]} body JSON:API object parsed by Jsona
 */
const createLayout = (body) => {
  const cmsContent = formatter.deserialize(body)

  // Save file for future reference
  writeJsonToFile(localFilesPath + '/download/kiosk.json', cmsContent)

  // Get the default layout file
  const layoutDefault = JSON.parse(fs.readFileSync(staticPath + '/templates/layout.json', 'utf8'))

  let defaultAttractBgImg = staticPath + '/image/attract-background.png'

  // Write layout information
  const { active, attract, explore, nav, region, storymap } = layoutDefault.state

  // Attract section
  attract.section.info.h1 = getHeader(cmsContent, 'title')

  attract.section.info.h2 = getHeader(cmsContent, 'field_translated_title')

  attract.section.info.logo = setFile(cmsContent.field_logo.image.uri.url)

  if (filepath = _.get(cmsContent, 'field_state_attract_bg_img.image.uri.url', defaultAttractBgImg)) {
    attract.background.img = setFile(filepath)
    defaultAttractBgImg = filepath
  }

  if (filepath = _.get(cmsContent, 'field_state_attract_bg_video.field_media_video_file.uri.url', false)) {
    attract.background.video = {
      src: setFile(cmsContent.field_state_attract_bg_video.field_media_video_file.uri.url),
      type: _.get(cmsContent, 'field_state_attract_bg_video.field_media_video_file.filemime', '')
    }

    // Check for MOV files
    if (attract.background.video.type === 'video/quicktime')
      attract.background.video.type = 'video/mp4'
  }

  // Active section
  if (process.env.KIOSK_VERSION === 'llc') {
    active.section.info.h1 = cmsContent.field_state_active_title
    active.section.info.translated.h1 = cmsContent.field_state_active_title_transla
    active.section.info.desc = cmsContent.field_state_active_desc.value
    active.section.info.translated.desc = cmsContent.field_state_active_desc_transla.value
    active.section.info.logo = setFile(cmsContent.field_logo.image.uri.url)
    active.section.info.translated.logo = active.section.info.logo

    if (filepath = _.get(cmsContent, 'field_state_active_bg_img.image.uri.url', defaultAttractBgImg))
      active.background.img = setFile(filepath)

    // Check for cropped version
    let imageName = path.basename(filepath)
    active.background.img = setFile('/sites/default/files/styles/story_map_header_image/public/' + imageName)

    active.section.bottom.title = cmsContent.field_callout.field_heading
    active.section.bottom.body = cmsContent.field_callout.body.value
    active.section.bottom.translated.title = cmsContent.field_translated_callout.field_heading
    active.section.bottom.translated.body = cmsContent.field_translated_callout.body.value
  }

  // Nav section
  nav.section.info.h1 = getHeader(cmsContent, 'field_state_nav_title')

  nav.section.info.h2 = getHeader(cmsContent, 'field_state_nav_translated_title')

  nav.section.info.logo = setFile(cmsContent.field_logo.image.uri.url)

  // Use attract screen background as template for others
  if (filepath = _.get(cmsContent, 'field_state_nav_bg_img.image.uri.url', defaultAttractBgImg))
    nav.background.img = setFile(filepath)

  if (filepath = _.get(cmsContent, 'field_state_nav_bg_video.field_media_video_file.uri.url', false)) {
    nav.background.video = {
      src: setFile(cmsContent.field_state_nav_bg_video.field_media_video_file.uri.url),
      type: _.get(cmsContent, 'field_state_nav_bg_video.field_media_video_file.filemime', '')
    }

    // Check for MOV files
    if (nav.background.video.type === 'video/quicktime')
      nav.background.video.type = 'video/mp4'
  }

  // Explore section
  explore.section.info.h1 = getHeader(cmsContent, 'field_state_explore_title')

  explore.section.info.h2 = getHeader(cmsContent, 'field_state_explore_translated_title')

  explore.section.info.desc = getHeader(cmsContent, 'field_state_explore_desc')

  explore.section.info.logo = setFile(cmsContent.field_logo.image.uri.url)

  if (filepath = _.get(cmsContent, 'field_state_explore_bg_img.image.uri.url', defaultAttractBgImg))
    explore.background.img = setFile(filepath)

  explore.section.interaction.map = _.get(cmsContent, 'field_explore_map', '')

  // Region section
  region.section.info.logo = setFile(cmsContent.field_logo.image.uri.url)

  // Story map section
  storymap.section.info.h1 = getHeader(cmsContent, 'field_state_storymap_title')

  explore.section.info.h2 = getHeader(cmsContent, 'field_state_storymap_translated_title')

  storymap.section.info.logo = setFile(cmsContent.field_logo.image.uri.url)

  // Write changes back to the layout.json file
  return layoutDefault
}

/**
 * Sets data to a storymaps.json object and writes the stringify object to file
 *
 * @param {[Object]} body JSON:API object parsed by Jsona
 */
const createStorymaps = (body) => {
  const cmsContent = formatter.deserialize(body)

  appendImageDerivatives(cmsContent, body)

  writeJsonToFile(downloadPath + '/storymaps.json', cmsContent)

  let storyMapList
  let primaryColor = null
  let secondaryColor = null
  if (process.env.KIOSK_VERSION === 'cdi') {
    storyMapList = cmsContent
  } else {
    storyMapList = cmsContent.field_story_map
  }

  const primaryStorymaps = storyMapList.map((storymap) => {
    let concatStorymap

    let storyMapImageSrc = storymap.field_media.image.uri.url
    if (storymap.field_media.meta && storymap.field_media.meta.story_map_header_image) {
      storyMapImageSrc = storymap.field_media.meta.story_map_header_image.url
    }

    if (process.env.KIOSK_VERSION === 'llc') {
      primaryColor = storymap.field_color_primary.color
      secondaryColor = storymap.field_color_secondary.color
    }

    const storyMapImage = setFile(storyMapImageSrc)
    if (storymap.field_translated_id !== null && storymap.field_translated_title !== null && storymap.field_translated_id.length > 0 && storymap.field_translated_title.length > 0)
      concatStorymap = { ...storymapTemplate, ...{id: storymap.field_id}, ...{uuid: storymap.id}, ...{name: storymap.field_story_map_title}, ...{language: 'en'}, ...{weight: storymap.field_weight}, ...{theme: {background: storyMapImage, color: {primary: primaryColor, secondary: secondaryColor}}}, ...{callout: {title: storymap.field_callout.field_heading, body: storymap.field_callout.body.value}}, ...{relationships: {id: storymap.field_translated_id}}, ...{titles: {primary: storymap.field_button_title, secondary: storymap.field_translated_button_title}}}
    else
      concatStorymap = { ...storymapTemplate, ...{id: storymap.field_id}, ...{uuid: storymap.id}, ...{name: storymap.field_story_map_title}, ...{language: 'en'}, ...{weight: storymap.field_weight}, ...{theme: {background: storyMapImage ,color: {primary: primaryColor, secondary: secondaryColor}}}, ...{callout: {title: storymap.field_callout.field_heading, body: storymap.field_callout.body.value}}, ...{titles: {primary: storymap.field_button_title, secondary: storymap.field_translated_button_title}}}

    if (process.env.KIOSK_VERSION === 'cdi') {
      if (storymap.field_flag !== null) {
        concatStorymap.theme.flag = setFile(storymap.field_flag.image.uri.url)
      } else {
        concatStorymap.theme.flag = '/static/images/empty-flag.png'
      }
    }

    return concatStorymap
  })

  const translatedStorymaps = storyMapList.map((storymap) => {
    let concatStorymap

    let storyMapImageSrc = storymap.field_media.image.uri.url
    if (storymap.field_media.meta && storymap.field_media.meta.story_map_header_image) {
      storyMapImageSrc = storymap.field_media.meta.story_map_header_image.url
    }
    const storyMapImage = setFile(storyMapImageSrc)

    if (storymap.field_translated_id !== null && storymap.field_translated_title !== null && storymap.field_translated_id.length > 0 && storymap.field_translated_title.length > 0) {
      if (process.env.KIOSK_VERSION === 'cdi') {
        concatStorymap = { ...storymapTemplate, ...{id: storymap.field_translated_id},  ...{uuid: storymap.id + '-alt'}, ...{name: storymap.field_translated_title}, ...{language: 'es'}, ...{weight: storymap.field_weight}, ...{theme: {background: storyMapImage, color: {primary: '#' + storymap.field_color, secondary: ''}}}, ...{callout: {title: storymap.field_translated_callout.field_heading, body: storymap.field_translated_callout.body.value}}, ...{relationships: {id: storymap.field_id}}, ...{titles: {primary: storymap.field_button_title, secondary: storymap.field_translated_button_title}}}
      } else {
        concatStorymap = { ...storymapTemplate, ...{id: storymap.field_translated_id},  ...{uuid: storymap.id + '-alt'}, ...{name: storymap.field_translated_title}, ...{language: 'es'}, ...{weight: storymap.field_weight}, ...{theme: {background: storyMapImage, color: {primary: storymap.field_color_primary.color, secondary: storymap.field_color_secondary.color}}}, ...{callout: {title: storymap.field_translated_callout.field_heading, body: storymap.field_translated_callout.body.value}}, ...{relationships: {id: storymap.field_id}}, ...{titles: {primary: storymap.field_button_title, secondary: storymap.field_translated_button_title}}}
      }
    }

    if (concatStorymap && process.env.KIOSK_VERSION === 'cdi') {
      concatStorymap.theme.flag = `${process.env.BACKEND_URL}/modules/client/ik_d8_module_wb_migration/includes/flags/${storymap.field_country.field_iso_code.toLowerCase()}.png`
    }

    return concatStorymap
  }).filter((result) => result !== undefined)

  const storymaps = primaryStorymaps.concat(translatedStorymaps)

  return storymaps
}

const createRegions = (body, featuredRegion) => {
  const cmsContent = formatter.deserialize(body)

  // Save file for future reference
  writeJsonToFile(downloadPath + '/regions.json', cmsContent)

  const regions = cmsContent.map((region, index) => {
    let background_video = null
    let background_video_type = null

    try {
      background_video = setFile(region.field_nav_region_video.field_media_video_file.uri.url)
      background_video_type = region.field_nav_region_video.field_media_video_file.filemime

          // Check for MOV files
    if (background_video_type === 'video/quicktime')
      background_video_type = 'video/mp4'

    } catch (e) {
      background_video = null
    }

    return {
      ...regionTemplate,
      ...{ id: region.drupal_internal__tid },
      ...{ machine_name: region.field_machine_name },
      ...{ name: region.name },
      ...{ translated: region.field_translated_display_name},
      ...{ featured: region.drupal_internal__tid === featuredRegion },
      ...{ theme: {
          color: {
            primary: region.field_primary.color,
            secondary: region.field_secondary.color
          }
        }},
        ...{ media: {
          background_video: background_video,
          background_video_type: background_video_type
        }}
      }
  })

  return regions
}

/**
 * Export the logic so that the 
 */
module.exports = async (event, logger) => {
  const { BACKEND_URL, KIOSK_VERSION, KIOSK_UUID } = process.env

  /**
   * Set up events that track files which are downloading.
   * 
   * Obvious point of failure is if a few files finish before
   * the next files kick start.
   */
  event.on('add-file', () => {
    this.event.total += 1
    this.event.file += 1
  })

  event.on('remove-file', () => {
    this.event.file -= 1

    if (this.event.file === 0) {
      this.event.emit('finish-build')
    }
  })

  // Make event a local in scope
  this.event = event

  // Track total downloaded
  this.event.total = 0

  // Track number of files downloading
  this.event.file = 0

  // Endpoint for the Kiosk node
  const kiosk = new URL(`/jsonapi/node/kiosk_${KIOSK_VERSION.toLowerCase()}/${KIOSK_UUID}`, BACKEND_URL)
  const map = new Map()

  // Set a large amount of query parameters
  if (KIOSK_VERSION === 'llc') {
    map.set('include', [
        'field_callout',
        'field_translated_callout',
        'field_logo',
        'field_logo.image',
        'field_state_active_bg_img',
        'field_state_active_bg_img.image',
        'field_state_attract_bg_img',
        'field_state_attract_bg_img.image',
        'field_state_attract_bg_video',
        'field_state_attract_bg_video.field_media_video_file',
        'field_state_nav_bg_img',
        'field_state_nav_bg_img.image',
        'field_state_explore_bg_img',
        'field_state_explore_bg_img.image',
        'field_story_map',
        'field_story_map.field_callout',
        'field_story_map.field_translated_callout',
        'field_story_map.field_media',
        'field_story_map.field_media.image',
      ].join(','))
  } else {
        map.set('include', [
        'field_logo',
        'field_logo.image',
        'field_region',
        'field_state_attract_bg_img',
        'field_state_attract_bg_img.image',
        'field_state_attract_bg_video',
        'field_state_attract_bg_video.field_media_video_file',
        'field_state_nav_bg_img',
        'field_state_nav_bg_img.image',
        'field_state_nav_bg_video',
        'field_state_nav_bg_video.field_media_video_file'
      ].join(','))
  }

  params = new URLSearchParams(map)
  kiosk.search = decodeURIComponent(params.toString())

  let kioskResponse = {}

  try {
    // Grab response, format it, and save the object
    const response = await axios.get(kiosk.toString())
    const apiLayout = createLayout(response.data)
    writeJsonToFile(apiPath + '/layout.json', apiLayout)

    if (KIOSK_VERSION === 'llc') {
      const apiStorymaps = createStorymaps(response.data)
      writeJsonToFile(apiPath + '/storymaps.json', apiStorymaps)
    }

    // Pass the kiosk data outside this scope
    kioskResponse = formatter.deserialize(response.data)
  } catch (error) {
    this.event.emit('build-error', error)
  }

  if (KIOSK_VERSION === 'cdi') {
    // Get Regions for Cultural Dive Ins
    taxonomy = new URL('/jsonapi/taxonomy_term/cdi_region?sort=weight&include=field_nav_region_video,field_nav_region_video.field_media_video_file', BACKEND_URL)

    try {
      // Grab the regions
      const response = await axios.get(taxonomy.toString())

      // Use the regions to get Story Maps which are tagged with those regions
      const regionStorymaps = response.data.data.map(
        region => axios.get(
          new URL(`/jsonapi/node/story_map?filter[field_region.tid]=${region.attributes.drupal_internal__tid}&include=field_callout,field_flag,field_flag.image,field_translated_callout,field_media,field_media.image,field_region,field_country`, BACKEND_URL)
            .toString()
      ))
      const storymapGroup = await axios.all(regionStorymaps)

      /**
       * Given a group of story maps from multiple requests,
       * group them into a single JSON:API object
       */
      const storymaps = storymapGroup.reduce((accumulator, region) => {
        if (region.data.data.length > 0) {
          let newAcc = {...accumulator, ...{ jsonapi: region.data.jsonapi }, ...{ links: region.data.links }}
          newAcc.data = accumulator.data.concat(region.data.data)
          newAcc.included = accumulator.included.concat(region.data.included)
          return newAcc
        } else {
          return accumulator
        }
      }, {jsonapi: {}, data: [], included: [], links: {}})

      // Format the the story maps and regions
      const storymapApi = createStorymaps(storymaps)
      const primaryRegion = kioskResponse.field_region.drupal_internal__tid
      const regions = createRegions(response.data, primaryRegion)

      // Take regions and associate story map field_id to those regions
      const newRegions = regions.map(region => {
        region.storymaps = formatter.deserialize(storymaps).map(storymap => {
          if (region.id === storymap.field_region.drupal_internal__tid) {
            // Also add the region theme colors to the story maps
            storymapApi.forEach((x, y, z) => {
              // If story map object UUID = JSON:API UUID
              if (x.uuid === storymap.id) {
                // Set story map object theme color to current region theme color
                z[y].theme.color = region.theme.color

                // Add color to the translated story maps
                if (x.relationships.id.length > 0) {
                  let rel = x.relationships.id
                  z.forEach((a, b, c) => {
                    if (a.id === rel) {
                      c[b].theme.color = region.theme.color
                    }
                  })
                }
              }
            })
            return storymap.id
          }
        }).filter(x => x !== undefined)
        return region
      })

      // Write these objects to the api static endpoints
      writeJsonToFile(apiPath + '/storymaps.json', storymapApi)
      writeJsonToFile(apiPath + '/regions.json', newRegions)
    } catch (error) {
      console.error(error)
      this.event('build-error', error)
    }
  }
}