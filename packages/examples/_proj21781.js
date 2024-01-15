
import {register as olProj4Register} from 'ol/proj/proj4.js';
import proj4 from 'proj4';
import {get as getProjection} from 'ol/proj.js';

const epsg21781def = [
  '+proj=somerc',
  '+lat_0=46.95240555555556',
  '+lon_0=7.439583333333333',
  '+k_0=1',
  '+x_0=600000',
  '+y_0=200000',
  '+ellps=bessel',
  '+towgs84=674.374,15.056,405.346,0,0,0,0',
  '+units=m',
  '+no_defs'
].join(' ');
const epsg21781extent = [420000, 30000, 900000, 350000];

proj4.defs('EPSG:21781', epsg21781def);

olProj4Register(proj4);
getProjection('EPSG:21781').setExtent(epsg21781extent);

