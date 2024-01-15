import OLCesium, {createMatrixAtCoordinates} from 'olcs';
import olView from 'ol/View.js';
import {defaults as olControlDefaults} from 'ol/control.js';
import olSourceOSM from 'ol/source/OSM.js';
import olLayerTile from 'ol/layer/Tile.js';
import olStyleText from 'ol/style/Text.js';
import olStyleIcon from 'ol/style/Icon.js';
import olStyleStyle from 'ol/style/Style.js';
import olGeomPoint from 'ol/geom/Point.js';
import olFeature from 'ol/Feature.js';
import olStyleStroke from 'ol/style/Stroke.js';
import {defaults as interactionDefaults} from 'ol/interaction.js';
import olStyleFill from 'ol/style/Fill.js';
import olMap from 'ol/Map.js';
import olGeomCircle from 'ol/geom/Circle.js';
import olFormatTopoJSON from 'ol/format/TopoJSON.js';
import olStyleCircle from 'ol/style/Circle.js';
import olFormatKML from 'ol/format/KML.js';
import olSourceVector from 'ol/source/Vector.js';
import olFormatIGC from 'ol/format/IGC.js';
import olFormatGeoJSON from 'ol/format/GeoJSON.js';
import olFormatGPX from 'ol/format/GPX.js';
import olGeomPolygon from 'ol/geom/Polygon.js';
import olInteractionDragAndDrop from 'ol/interaction/DragAndDrop.js';
import olGeomMultiPolygon from 'ol/geom/MultiPolygon.js';
import olLayerVector from 'ol/layer/Vector.js';
import {transform} from 'ol/proj.js';
import {OLCS_ION_TOKEN} from './_common.js';


const iconFeature = new olFeature({
  geometry: new olGeomPoint([700000, 200000, 100000])
});

const textFeature = new olFeature({
  geometry: new olGeomPoint([1000000, 3000000, 500000])
});

const cervinFeature = new olFeature({
  geometry: new olGeomPoint([852541, 5776649])
});
cervinFeature.getGeometry().set('altitudeMode', 'clampToGround');


const modelFeatures = [-1, -1 / 2, 0, 1 / 2, 1, 3 / 2].map(
    factor => new olFeature({
      geometry: new olGeomPoint([852641, 5776749, 4500]),
      'rotation': factor * Math.PI
    })
);


const iconStyle = new olStyleStyle({
  image: new olStyleIcon(/** @type {olx.style.IconOptions} */ ({
    anchor: [0.5, 46],
    anchorXUnits: 'fraction',
    anchorYUnits: 'pixels',
    opacity: 0.75,
    src: 'data/icon.png'
  })),
  text: new olStyleText({
    text: 'Some text',
    textAlign: 'center',
    textBaseline: 'middle',
    stroke: new olStyleStroke({
      color: 'magenta',
      width: 3
    }),
    fill: new olStyleFill({
      color: 'rgba(0, 0, 155, 0.3)'
    })
  })
});

const textStyle = [new olStyleStyle({
  text: new olStyleText({
    text: 'Only text',
    textAlign: 'center',
    textBaseline: 'middle',
    stroke: new olStyleStroke({
      color: 'red',
      width: 3
    }),
    fill: new olStyleFill({
      color: 'rgba(0, 0, 155, 0.3)'
    })
  })
}), new olStyleStyle({
  geometry: new olGeomCircle([1000000, 3000000, 10000], 2e6),
  stroke: new olStyleStroke({
    color: 'blue',
    width: 2
  }),
  fill: new olStyleFill({
    color: 'rgba(0, 0, 255, 0.2)'
  })
})];

iconFeature.setStyle(iconStyle);

textFeature.setStyle(textStyle);

cervinFeature.setStyle(iconStyle);
let iCase = 0;
modelFeatures.forEach((feature) => {
  ++iCase;
  const modelStyle = new olStyleStyle({
    image: new olStyleIcon(/** @type {olx.style.IconOptions} */ ({
      anchor: [0.5, 46],
      anchorXUnits: 'fraction',
      anchorYUnits: 'pixels',
      opacity: 0.75,
      src: 'data/icon.png'
    }))
  });
  const olcsModelFunction = () => {
    const coordinates = feature.getGeometry().getCoordinates();
    const center = transform(coordinates, 'EPSG:3857', 'EPSG:4326');
    const rotation = /** @type {number} */ (feature.get('rotation'));
    return {
      cesiumOptions: {
        url: 'data/Box.gltf',
        modelMatrix: createMatrixAtCoordinates(center, rotation),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        minimumPixelSize: 64
      }
    };
  };
  let host = feature;
  switch (iCase % 3) {
    case 0:
      host = feature.getGeometry();
      break;
    case 1:
      modelStyle.setGeometry(feature.getGeometry().clone());
      host = modelStyle.getGeometry();
      break;
    default:
      host = feature;
  }
  host.set('olcs_model', olcsModelFunction);
  feature.setStyle(modelStyle);
});


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
      lineDash: [12],
      width: 10
    })
  })],
  'MultiLineString': [new olStyleStyle({
    stroke: new olStyleStroke({
      color: 'green',
      width: 10
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
      lineDash: [4],
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
  url: 'data/geojson/vector_data.geojson'
});

const theCircle = new olFeature(new olGeomCircle([5e6, 7e6, 5e5], 1e6));

// Add a Cesium rectangle, via setting the property olcs.polygon_kind
const cartographicRectangleStyle = new olStyleStyle({
  fill: new olStyleFill({
    color: 'rgba(255, 69, 0, 0.7)'
  }),
  stroke: new olStyleStroke({
    color: 'rgba(255, 69, 0, 0.9)',
    width: 1
  })
});
const cartographicRectangleGeometry = new olGeomPolygon([[[-5e6, 11e6],
  [4e6, 11e6], [4e6, 10.5e6], [-5e6, 10.5e6], [-5e6, 11e6]]]);
cartographicRectangleGeometry.set('olcs.polygon_kind', 'rectangle');
const cartographicRectangle = new olFeature({
  geometry: cartographicRectangleGeometry
});
cartographicRectangle.setStyle(cartographicRectangleStyle);

// Add two Cesium rectangles with height and the property olcs.polygon_kind
const cartographicRectangleGeometry2 = new olGeomMultiPolygon([
  [[
    [-5e6, 12e6, 0], [4e6, 12e6, 0], [4e6, 11.5e6, 0], [-5e6, 11.5e6, 0],
    [-5e6, 12e6, 0]
  ]],
  [[
    [-5e6, 11.5e6, 1e6], [4e6, 11.5e6, 1e6], [4e6, 11e6, 1e6],
    [-5e6, 11e6, 1e6], [-5e6, 11.5e6, 1e6]
  ]]
]);
cartographicRectangleGeometry2.set('olcs.polygon_kind', 'rectangle');
const cartographicRectangle2 = new olFeature({
  geometry: cartographicRectangleGeometry2
});
cartographicRectangle2.setStyle(cartographicRectangleStyle);

const vectorLayer = new olLayerVector({
  style: styleFunction,
  source: vectorSource
});

const vectorSource2 = new olSourceVector({
  features: [iconFeature, textFeature, cervinFeature, ...modelFeatures, cartographicRectangle,
    cartographicRectangle2]
});
const vectorLayer2 = new olLayerVector({
  source: vectorSource2
});

const dragAndDropInteraction = new olInteractionDragAndDrop({
  formatConstructors: [
    olFormatGPX,
    olFormatGeoJSON,
    olFormatIGC,
    olFormatKML,
    olFormatTopoJSON
  ]
});

const map = new olMap({
  interactions: interactionDefaults().extend([dragAndDropInteraction]),
  layers: [
    new olLayerTile({
      source: new olSourceOSM()
    }),
    vectorLayer,
    vectorLayer2
  ],
  target: 'map2d',
  controls: olControlDefaults({
    attributionOptions: {
      collapsible: false
    }
  }),
  view: new olView({
    center: [0, 0],
    zoom: 2
  })
});

dragAndDropInteraction.on('addfeatures', (event) => {
  const vectorSource = new olSourceVector({
    features: event.features,
    projection: event.projection
  });
  map.getLayers().push(new olLayerVector({
    source: vectorSource,
    style: styleFunction
  }));
  const view = map.getView();
  view.fitExtent(
      vectorSource.getExtent(), /** @type {ol.Size} */ (map.getSize()));
});


Cesium.Ion.defaultAccessToken = OLCS_ION_TOKEN;
const ol3d = new OLCesium({map, target: 'map3d'});
const scene = ol3d.getCesiumScene();
Cesium.createWorldTerrainAsync().then(tp => scene.terrainProvider = tp);
ol3d.setEnabled(true);

const csLabels = new Cesium.LabelCollection();
csLabels.add({
  position: Cesium.Cartesian3.fromRadians(20, 20, 0),
  text: 'Pre-existing primitive'
});
scene.primitives.add(csLabels);

// Adding a feature after the layer has been synchronized.
vectorSource.addFeature(theCircle);

let hasTheVectorLayer = true;
window['addOrRemoveOneVectorLayer'] = function() {
  if (hasTheVectorLayer) {
    map.getLayers().remove(vectorLayer);
  } else {
    map.getLayers().insertAt(1, vectorLayer);
  }
  hasTheVectorLayer = !hasTheVectorLayer;
};

window['addOrRemoveOneFeature'] = function() {
  const found = vectorSource2.getFeatures().indexOf(iconFeature);
  if (found === -1) {
    vectorSource2.addFeature(iconFeature);
  } else {
    vectorSource2.removeFeature(iconFeature);
  }
};

let oldStyle = new olStyleStyle({
  stroke: new olStyleStroke({
    color: 'blue',
    width: 2
  }),
  fill: new olStyleFill({
    color: 'green'
  })
});

window['toggleStyle'] = function() {
  const swap = theCircle.getStyle();
  theCircle.setStyle(oldStyle);
  oldStyle = swap;
};

window['toggleClampToGround'] = function() {
  let altitudeMode;
  if (!vectorLayer.get('altitudeMode')) {
    altitudeMode = 'clampToGround';
  }
  vectorLayer.set('altitudeMode', altitudeMode);
  vectorLayer2.set('altitudeMode', altitudeMode);
  map.removeLayer(vectorLayer);
  map.removeLayer(vectorLayer2);
  map.addLayer(vectorLayer);
  map.addLayer(vectorLayer2);
};

window['setTargetFrameRate'] = function() {
  let fps;
  const fpsEl = document.querySelector('#framerate');
  if (fpsEl) {
    fps = Number(fpsEl.value);
    ol3d.setTargetFrameRate(fps);
  }
};

window['ol3d'] = ol3d;
window['scene'] = scene;
document.getElementById('enable').addEventListener('click', () => ol3d.setEnabled(!ol3d.getEnabled()));

ol3d.enableAutoRenderLoop();
