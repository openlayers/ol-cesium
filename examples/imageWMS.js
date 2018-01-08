/* eslint googshift/valid-provide-and-module: 0 */

goog.provide('examples.main');

goog.require('olcs.OLCesium');
goog.require('ol.View');
goog.require('ol.control');
goog.require('ol.source.ImageWMS');
goog.require('ol.source.OSM');
goog.require('ol.layer.Image');
goog.require('ol.layer.Tile');
goog.require('ol.Map');

const imageWMSSource = new ol.source.ImageWMS({
  url: 'https://demo.boundlessgeo.com/geoserver/wms',
  params: {'LAYERS': 'topp:states'},
  ratio: 1
});

const ol2d = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    }),
    new ol.layer.Image({
      extent: [-13884991, 2870341, -7455066, 6338219],
      source: imageWMSSource
    })
  ],
  controls: ol.control.defaults({
    attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
      collapsible: false
    })
  }),
  target: 'map',
  view: new ol.View({
    center: [-10967567.978507737, 4204193.972847062],
    zoom: 3
  })
});

const ol3d = new olcs.OLCesium({
  map: ol2d,
  time() {
    return Cesium.JulianDate.now();
  }
});
const scene = ol3d.getCesiumScene();
const terrainProvider = new Cesium.CesiumTerrainProvider({
  url: '//assets.agi.com/stk-terrain/world',
  requestVertexNormals: true
});
scene.terrainProvider = terrainProvider;
ol3d.setEnabled(true);



