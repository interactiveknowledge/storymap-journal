const electron = require('electron')
const os = require('os')
const ua = require('universal-analytics')
const uuid = require('uuid/v4')

window.ipcRenderer = electron.ipcRenderer
window.user = os.userInfo().username

if (process.env.GOOGLE_ANALYTICS && process.env.ENV === 'production') {
  window.visitor = ua(process.env.GOOGLE_ANALYTICS, uuid())
}