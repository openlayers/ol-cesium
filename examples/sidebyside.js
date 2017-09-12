/* eslint googshift/valid-provide-and-module: 0 */

goog.provide('examples.sidebyside');

goog.require('olcs.OLCesium');
goog.require('ol.source.OSM');
goog.require('ol.layer.Tile');
goog.require('ol.Map');
goog.require('ol.proj');
goog.require('ol.View');


const view = new ol.View({
  center: ol.proj.transform([25, 20], 'EPSG:4326', 'EPSG:3857'),
  zoom: 3,
  rotation: Math.PI / 6
});

const ol2d = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  target: 'map2d',
  view
});

const ol3d = new olcs.OLCesium({map: ol2d, target: 'map3d'});
const scene = ol3d.getCesiumScene();
const terrainProvider = new Cesium.CesiumTerrainProvider({
  url: '//assets.agi.com/stk-terrain/world'
});
scene.terrainProvider = terrainProvider;
ol3d.setEnabled(true);
