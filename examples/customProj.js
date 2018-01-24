/* eslint googshift/valid-provide-and-module: 0 */

goog.provide('examples.customProj');

goog.require('olcs.OLCesium');
goog.require('ol.View');
goog.require('ol.source.ImageWMS');
goog.require('ol.source.OSM');
goog.require('ol.layer.Image');
goog.require('ol.layer.Tile');
goog.require('ol.Map');
goog.require('ol.proj');

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
ol.proj.get('EPSG:21781').setExtent(epsg21781extent);

const customProjSource = new ol.source.ImageWMS({
  attributions: '© <a href="http://www.geo.admin.ch/internet/geoportal/' +
  'en/home.html">National parks / geo.admin.ch</a>',
  crossOrigin: 'anonymous',
  params: {'LAYERS': 'ch.bafu.schutzgebiete-paerke_nationaler_bedeutung'},
  projection: 'EPSG:21781',
  url: 'https://wms.geo.admin.ch/'
});

customProjSource.set('olcs.projection', ol.proj.get('EPSG:3857'));

const ol2d = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    }),
    new ol.layer.Image({
      source: customProjSource
    })
  ],
  target: 'map',
  view: new ol.View({
    center: [860434.6266531206, 6029479.0044273855],
    zoom: 6
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
