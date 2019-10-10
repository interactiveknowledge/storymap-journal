// Node API
const fs = require('fs')
const os = require('os')
const path = require('path')

// Installed packages
const axios = require('axios')

// Local API
const build = require('./server/build')
const events = require('./server/events')

// Installed packages
const express = require('express')

// Import package info
const pkg = require('./package.json')

// Import environment specific configuration
const localConfig = require('dotenv').config({
  path: path.resolve(__dirname, '.env')
}).parsed

// Concat the environment variables
process.env = { ...localConfig, ...process.env,}

// Set up useful variables
const user = os.userInfo().username
const dev = (process.env.ENV === 'dev')
const environmentLongName = (dev === true) ? 'Development' : 'Production'
const environmentPath = (dev === true) ? 'src' : 'deploy'

// Get and set data
const versionLongName = (process.env.KIOSK_VERSION === 'llc') ? 'LEAF Love & Connections' : 'Cultural Dive In'

if (dev === true) {
  console.log('Building', versionLongName)
}

// Set up local paths for files
const localFilesPath = require("os").homedir() + '/.storymap-kiosk'

if (fs.existsSync(localFilesPath) === false) {
  fs.mkdirSync(localFilesPath, { recursive: true })
}

// Api is writable and contains JSON layout and info files for kiosk
const apiPath = localFilesPath + '/api'

if (fs.existsSync(apiPath) === false) {
  fs.mkdirSync(apiPath, { recursive: true })
}

// Static path contains templates and packaged assets
const staticPath = path.join(__dirname, './static')

if (fs.existsSync(staticPath) === false) {
  fs.mkdirSync(staticPath, { recursive: true })
}

// Download path is where content is downloaded
const downloadPath = localFilesPath + '/download'

if (fs.existsSync(downloadPath) === false) {
  fs.mkdirSync(downloadPath, { recursive: true })
}

// Create server app
const server = express()

// Only need to serve static files
// The Filesystem API
server.use('/api', express.static(apiPath))
// Static Files
server.use('/static', express.static(staticPath))
// Dynamic files
server.use('/dynamic', express.static(localFilesPath))
// The app
server.use(express.static(path.join(__dirname, './' + environmentPath)))

// Start the Express Server
server.listen(3000, error => {
  if (error) {
    throw error
  } else {
    if (dev === true) {
      console.log(environmentLongName + ' server ready!', (process.env.BUILD_TARGET === 'browser') ? 'http://localhost:3000/' : 'electron app')
    }

    if (process.env.BUILD_TARGET === 'electron') {
      const { app, BrowserWindow, ipcMain, ipcRenderer } = require('electron')

      const logger = require('electron-log')
      let loadingWindow
      let mainWindow

      /**
       * notify Sentry of errors and other things.
       *
       * @param {*} message
       * @param {*} level
       * @param {*} exception
       */
      const notifySentry = (message, level, exception = true) => {
        if (process.env.ENV === 'production') {
          if (process.env.SENTRY_DSN) {

            const Sentry = require('@sentry/electron')
            const os = require('os')
            const user = os.userInfo().username
            const pkg = require('../package.json')

            Sentry.init({ dsn: process.env.SENTRY_DSN })

            Sentry.configureScope((scope) => {
              scope.setUser({ 'username': user })
              scope.setTag('platform', os.platform())
              scope.setTag('version', pkg.version)
              scope.setTag('kiosk_version', process.env.KIOSK_VERSION)
              if (process.env.KIOSK_VERSION === 'cdi') {
                scope.setTag('cdi_region', process.env.KIOSK_REGION)
              }
              scope.setTag('drupal_kiosk_uuid', process.env.KIOSK_UUID)
              scope.setLevel(level)
            })

            if (exception === true) {
              Sentry.captureException(message)
            } else {
              Sentry.captureMessage(message)
            }
          }
        } else {
          logger.error(message)
        }
      }

    /**
     * Send log message to remote URL
     *
     * @param {string} message
     * @param {string} level
     * @param {boolean} [override=false]
     *   whether to override the level. (only log warn, errors or fatals but sometimes we want the info or debug levels to get sent)
     */
    const logRemotely = (message, level, override = false) => {
      if (process.env.REMOTE_LOG_URL && process.env.ENV === 'production') {
          if (level === 'warn' || level === 'warning' || level === 'error' || level === 'fatal' || level === 'info' || override === true) {
            axios.post(process.env.REMOTE_LOG_URL, {
              application: pkg.productName || pkg.name,
              version: pkg.version,
              user: user,
              level: level,
              message: message
            })
          }
        }
      }

      /**
       * Handle all electron messaging.
       * 
       * @param {*} event
       *   Optional but exists to pass into ipcMain event callbacks.
       * @param {*} arg
       *   Object with a 'type' and 'message' property.
       */
      const logMessageToFile = (event = {}, arg) => {
        // Only log warnings, errors and fatals to sentry.
        const sentry = ['warning', 'error', 'fatal']
        if (process.env.ENV === 'production' && sentry.indexOf(arg.type) !== -1) {
          if (arg.type === 'warn') {
            arg.type = 'warning'
          }
          notifySentry(arg.message, arg.type, false)
        }

        // Adjust to match logger's types.
        if (arg.type === 'warning') {
          arg.type = 'warn'
        }

        if (arg.type === 'fatal') {
          arg.type = 'error'
        }
      
        logRemotely(arg.message, arg.type)
        logger[arg.type](arg.message)
      }

      // Loading window will appear while files are downloading
      function createLoadingWindow () {
        return new BrowserWindow({
          fullscreen: process.env.ELECTRON_FULLSCREEN === '1',
          height: parseInt(process.env.ELECTRON_HEIGHT, 10),
          show: false,
          webPreferences: {
            experimentalFeatures: true,
            nodeIntegration: true, // Necessary for progress/loading window
            webSecurity: false
          },
          width: parseInt(process.env.ELECTRON_WIDTH, 10)
        })
      }

      // The Main Window loads 
      function createMainWindow () {
        const w = new BrowserWindow({
          fullscreen: process.env.ELECTRON_FULLSCREEN === '1',
          height: parseInt(process.env.ELECTRON_HEIGHT, 10),
          show: false,
          webPreferences: {
            experimentalFeatures: true,
            nodeIntegration: false, // causing issues with JQuery
            preload: path.join(__dirname, '/preload.js'), // @see https://github.com/electron/electron/issues/9920
            webSecurity: false
          },
          width: parseInt(process.env.ELECTRON_WIDTH, 10)
        })

        w.on('closed', function () {
          mainWindow = null
        })

        let { webContents } = w

        webContents.on('crashed', () => {
          // Log error
          logMessageToFile({}, {
            type: 'error',
            message: 'App crashed! Creating new window.'
          })

          // Destroy window and start over
          mainWindow.destroy()

          mainWindow = createMainWindow()

          mainWindow.on('ready-to-show', () => {
            mainWindow.show()
          })
        })

        webContents.on('did-finish-load', () => {
          webContents.setZoomFactor(1)
          webContents.setVisualZoomLevelLimits(1, 1)
          webContents.setLayoutZoomLevelLimits(0, 0)
        })

        w.removeMenu()

        w.loadURL(`http://localhost:3000?version=${process.env.KIOSK_VERSION}&username=${process.env.ESRI_USER}&password=${process.env.ESRI_PASSWORD}`)

        return w
      }

      // Start by showing the loading page until the building data is done.
      app.on('ready', () => {
        const message = `Kiosk ${pkg.name} has started.`
        logRemotely(message, 'info', true)

        loadingWindow = createLoadingWindow()

        loadingWindow.once('show', () => {

          // Show the main window when event 'finish-build' is fired
          const eventFinishBuildCallback = () => {
            // Remove listener to prevent any chance of duplicate windows
            events.removeListener('finish-build', eventFinishBuildCallback)

            logMessageToFile({}, {
              type: 'info',
              message: `Data has finished downloading from Drupal from Kiosk UUID is ${process.env.KIOSK_UUID}.`
            })

            mainWindow = createMainWindow()

            mainWindow.once('ready-to-show', () => {
              loadingWindow.hide()
              loadingWindow.close()
              mainWindow.show()
            })
          }

          // Send files remaining to loading window for progress bar
          events.on('remove-file', () => {
            let downloaded = events.total - events.file
            let percentage = parseInt(parseFloat(downloaded/events.total).toFixed(2) * 100)
            loadingWindow.webContents.send('progress', { file: events.file, total: events.total, downloaded: downloaded, percentage: percentage })
          })

          events.on('finish-build', eventFinishBuildCallback)

          events.on('build-error', (error) => {
            logMessageToFile({}, {
              type: 'error',
              message: error
            })
          })

          // Build data from the CMS
          logMessageToFile({}, {
            type: 'info',
            message: `Start building data from Drupal. Kiosk UUID is ${process.env.KIOSK_UUID}.`
          })

          build(events)
        })

        loadingWindow.removeMenu()

        loadingWindow.loadFile('./loading.html')

        loadingWindow.show()
      })

      app.on('window-all-closed', function () {
        if (process.platform !== 'darwin') app.quit()
      })

      app.on('activate', function () {
        if (!loadingWindow) {
          loadingWindow = createLoadingWindow()
        }

        if (!mainWindow) {
          mainWindow = createMainWindow()

          mainWindow.on('ready-to-show', () => {
            mainWindow.show()
          })
        }
      })

      app.on('quit', () => {
        logMessageToFile({}, {
          type: 'info',
          message: 'App closed.'
        })
      })
      
      app.on('uncaughException', error => {
        logMessageToFile({}, {
          type: 'error',
          message: error
        })
      })
      
      app.on('unhandledRejection', error => {
        logMessageToFile({}, {
          type: 'error',
          message: error
        })
      })

      // Log to a file that holds a log of useful information
      ipcMain.on('log-message-to-file', logMessageToFile)

      ipcMain.on('navigate-new-window', (event, arg) => {
        logMessageToFile(event, {
          type: 'info',
          message: 'Electron reloading window to reset WebGL contexts.'
        })
        mainWindow.loadURL(arg)
      })
    } else {
      events.on('build-error', (error) => {
        console.error(error)
      })

      build(events)
    }
  }
})