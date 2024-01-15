import OLCesium from 'olcs';
import olView from 'ol/View.js';
import {defaults as olControlDefaults} from 'ol/control.js';
import olSourceOSM from 'ol/source/OSM.js';
import olLayerTile from 'ol/layer/Tile.js';
import olStyleText from 'ol/style/Text.js';
import olStyleStyle from 'ol/style/Style.js';
import olStyleStroke from 'ol/style/Stroke.js';
import olStyleFill from 'ol/style/Fill.js';
import olMap from 'ol/Map.js';
import olStyleCircle from 'ol/style/Circle.js';
import olSourceVector from 'ol/source/Vector.js';
import olFormatGeoJSON from 'ol/format/GeoJSON.js';
import olLayerVector from 'ol/layer/Vector.js';
import olFeature from 'ol/Feature.js';
import olCircle from 'ol/geom/Circle.js';
import {OLCS_ION_TOKEN} from './_common.js';

const image = new olStyleCircle({
  radius: 5,
  fill: null,
  stroke: new olStyleStroke({color: 'red', width: 1})
});

const styles = {
  'Point': [new olStyleStyle({
    image
  })],
  'LineString': [new olStyleStyle({
    stroke: new olStyleStroke({
      color: 'green',
      width: 2
    })
  })],
  'MultiLineString': [new olStyleStyle({
    stroke: new olStyleStroke({
      color: 'green',
      width: 2
    })
  })],
  'MultiPoint': [new olStyleStyle({
    image,
    text: new olStyleText({
      text: 'MP',
      stroke: new olStyleStroke({
        color: 'purple'
      })
    })
  })],
  'MultiPolygon': [new olStyleStyle({
    stroke: new olStyleStroke({
      color: 'yellow',
      width: 1
    }),
    fill: new olStyleFill({
      color: 'rgba(255, 255, 0, 0.1)'
    })
  })],
  'Polygon': [new olStyleStyle({
    stroke: new olStyleStroke({
      color: 'blue',
      width: 3
    }),
    fill: new olStyleFill({
      color: 'rgba(0, 0, 255, 0.1)'
    })
  })],
  'GeometryCollection': [new olStyleStyle({
    stroke: new olStyleStroke({
      color: 'magenta',
      width: 2
    }),
    fill: new olStyleFill({
      color: 'magenta'
    }),
    image: new olStyleCircle({
      radius: 10, // pixels
      fill: null,
      stroke: new olStyleStroke({
        color: 'magenta'
      })
    })
  })],
  'Circle': [new olStyleStyle({
    stroke: new olStyleStroke({
      color: 'red',
      width: 2
    }),
    fill: new olStyleFill({
      color: 'rgba(255,0,0,0.2)'
    })
  })]
};

const styleFunction = function(feature, resolution) {
  const geo = feature.getGeometry();
  // always assign a style to prevent feature skipping
  return geo ? styles[geo.getType()] : styles['Point'];
};

const vectorSource = new olSourceVector({
  format: new olFormatGeoJSON(),
  url: 'data/geojson/ground_vector_data.geojson'
});

const vectorLayer = new olLayerVector({
  source: vectorSource,
  style: styleFunction
});

vectorLayer.getSource().addFeature(new olFeature({
  geometry: new olCircle([16880133.570042003, -3565441.544459192], 200)
}));

const map = new olMap({
  layers: [
    new olLayerTile({
      source: new olSourceOSM()
    }),
    vectorLayer,
  ],
  target: 'map2d',
  controls: olControlDefaults({
    attributionOptions: {
      collapsible: false
    }
  }),
  view: new olView({
    center: [16880670.33392873, -3565966.2275828626],
    zoom: 15
  })
});

Cesium.Ion.defaultAccessToken = OLCS_ION_TOKEN;
vectorLayer.set('altitudeMode', 'clampToGround');
const ol3d = new OLCesium({map, target: 'map3d'});
const scene = ol3d.getCesiumScene();
Cesium.createWorldTerrainAsync().then(tp => scene.terrainProvider = tp);
ol3d.setEnabled(true);

window['toggleClampToGround'] = function() {
  let altitudeMode;
  if (!vectorLayer.get('altitudeMode')) {
    altitudeMode = 'clampToGround';
  }
  vectorLayer.set('altitudeMode', altitudeMode);
  map.removeLayer(vectorLayer);
  map.addLayer(vectorLayer);
};

window['ol3d'] = ol3d;
window['scene'] = scene;
document.getElementById('enable').addEventListener('click', () => ol3d.setEnabled(!ol3d.getEnabled()));

ol3d.enableAutoRenderLoop();
