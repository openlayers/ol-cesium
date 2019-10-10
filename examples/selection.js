/**
 * @module examples.selection
 */
import olStyleStroke from 'ol/style/Stroke.js';
import olStyleFill from 'ol/style/Fill.js';
import olStyleStyle from 'ol/style/Style.js';
import OLCesium from 'olcs/OLCesium.js';
import olView from 'ol/View.js';
import olFormatGeoJSON from 'ol/format/GeoJSON.js';
import olSourceVector from 'ol/source/Vector.js';
import olLayerVector from 'ol/layer/Vector.js';
import olSourceOSM from 'ol/source/OSM.js';
import olLayerTile from 'ol/layer/Tile.js';
import olMap from 'ol/Map.js';


const raster = new olLayerTile({
  source: new olSourceOSM()
});

const vector = new olLayerVector({
  source: new olSourceVector({
    format: new olFormatGeoJSON(),
    url: 'data/geojson/countries.geojson'
  })
});

const map = new olMap({
  layers: [raster, vector],
  target: 'map2d',
  view: new olView({
    center: [0, 0],
    zoom: 2
  })
});


const ol3d = new OLCesium({map, target: 'map3d'});
ol3d.setEnabled(true);



const selectionStyle = new olStyleStyle({
  fill: new olStyleFill({
    color: [255, 255, 255, 0.6]
  }),
  stroke: new olStyleStroke({
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
