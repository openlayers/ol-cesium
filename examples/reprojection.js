/* eslint googshift/valid-provide-and-module: 0 */

goog.provide('examples.reprojection');

goog.require('olcs.OLCesium');
goog.require('ol.View');
goog.require('ol.Map');
goog.require('ol.Attribution');
goog.require('ol.proj');
goog.require('ol.layer.Tile');
goog.require('ol.source.TileWMS');

proj4.defs('EPSG:21781', '+proj=somerc +lat_0=46.95240555555556 ' +
    '+lon_0=7.439583333333333 +k_0=1 +x_0=600000 +y_0=200000 +ellps=bessel ' +
    '+towgs84=674.4,15.1,405.3,0,0,0,0 +units=m +no_defs');
const proj21781 = ol.proj.get('EPSG:21781');
proj21781.setExtent([485071.54, 75346.36, 828515.78, 299941.84]);

const source = new ol.source.TileWMS({
  attributions: [new ol.Attribution({
    html: '&copy; ' +
        '<a href="http://www.geo.admin.ch/internet/geoportal/' +
        'en/home.html">' +
        'Pixelmap 1:1000000 / geo.admin.ch</a>'
  })],
  crossOrigin: 'anonymous',
  params: {
    'LAYERS': 'ch.swisstopo.pixelkarte-farbe-pk1000.noscale',
    'FORMAT': 'image/jpeg'
  },
  url: 'http://wms.geo.admin.ch/',
  projection: 'EPSG:21781'
});


const ol2d = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source
    })
  ],
  target: 'map',
  view: new ol.View({
    projection: 'EPSG:21781',
    center: ol.proj.transform([6.56273, 46.51781], 'EPSG:4326', 'EPSG:21781'),
    zoom: 6
  })
});

const ol3d = new olcs.OLCesium({map: ol2d});
const scene = ol3d.getCesiumScene();
const terrainProvider = new Cesium.CesiumTerrainProvider({
  url: '//assets.agi.com/stk-terrain/world'
});
scene.terrainProvider = terrainProvider;
ol3d.setEnabled(true);
