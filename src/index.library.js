import OLCesium from './olcs/OLCesium.js';
export default OLCesium;

const olcs = window['olcs'] = {};
olcs.OLCesium = OLCesium;
