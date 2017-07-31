1.0.0 / 2017-07-31
==================
  * extract electrify "meteor client" into own npm package
  * add Electrify.connected so you can still use your Meteor application without electrify/Electron
  * add option connectionWarning to disable warning when using as standalone Meteor application
  * Electrify.startup functions will be called directly when Electrify is already connected
  * add Electrify.versions with some Electron and Electrify related versions numbers