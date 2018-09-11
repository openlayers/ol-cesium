import OLCesium from './olcs/OLCesium.js';
export default OLCesium;

// Using var for phantomJS
// eslint-disable-next-line no-var
var olcs = window['olcs'] = {};
olcs.OLCesium = OLCesium;
