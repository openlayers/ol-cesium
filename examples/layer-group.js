/* eslint googshift/valid-provide-and-module: 0 */

goog.provide('examples.layer-group');

goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Group');
goog.require('ol.layer.Tile');
goog.require('ol.proj');
goog.require('ol.source.OSM');
goog.require('ol.source.TileJSON');
goog.require('olcs.OLCesium');

const layer0 = new ol.layer.Tile({
  source: new ol.source.OSM()
});

const layer10 = new ol.layer.Tile({
  source: new ol.source.TileJSON({
    url: 'https://api.tiles.mapbox.com/v3/mapbox.20110804-hoa-foodinsecurity-3month.json?secure',
    crossOrigin: 'anonymous'
  })
});

const layer11 = new ol.layer.Tile({
  source: new ol.source.TileJSON({
    url: 'https://api.tiles.mapbox.com/v3/mapbox.world-borders-light.json?secure',
    crossOrigin: 'anonymous'
  })
});

const layer1 = new ol.layer.Group({
  layers: [
    layer10,
    layer11
  ]
});

const ol2d = new ol.Map({
  layers: [layer0, layer1],
  target: 'map2d',
  view: new ol.View({
    center: ol.proj.fromLonLat([37.40570, 8.81566]),
    zoom: 4
  })
});

const ol3d = new olcs.OLCesium({map: ol2d, target: 'map3d'});
ol3d.setEnabled(true);

// eslint-disable-next-line no-unused-vars
function toggleLayer(element, layer) {
  layer.setVisible(element.checked);
}
// eslint-disable-next-line no-unused-vars
function setLayerOpacity(element, layer) {
  layer.setOpacity(parseFloat(element.value));
}
