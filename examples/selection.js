const raster = new ol.layer.Tile({
  source: new ol.source.OSM()
});

const vector = new ol.layer.Vector({
  source: new ol.source.Vector({
    format: new ol.format.GeoJSON(),
    url: 'data/geojson/countries.geojson'
  })
});

const map = new ol.Map({
  layers: [raster, vector],
  target: 'map2d',
  view: new ol.View({
    center: [0, 0],
    zoom: 2
  })
});


const ol3d = new olcs.OLCesium({map, target: 'map3d'});
ol3d.setEnabled(true);



const selectionStyle = new ol.style.Style({
  fill: new ol.style.Fill({
    color: [255, 255, 255, 0.6]
  }),
  stroke: new ol.style.Stroke({
    color: [0, 153, 255, 1],
    width: 3
  })
});

let selectedFeature;
map.on('click', (e) => {
  if (selectedFeature) {
    selectedFeature.setStyle(null);
  }
  selectedFeature = map.forEachFeatureAtPixel(
      e.pixel,
      (feature, layer) => feature);
  if (selectedFeature) {
    selectedFeature.setStyle(selectionStyle);
  }
});

