var iconFeature = new ol.Feature({
  geometry: new ol.geom.Point([700000, 200000, 100000]),
});

var iconStyle = new ol.style.Style({
  image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
    anchor: [0.5, 46],
    anchorXUnits: 'fraction',
    anchorYUnits: 'pixels',
    opacity: 0.75,
    src: 'data/icon.png'
  })),
    text: new ol.style.Text({
      text: 'Some text',
      textAlign: 'center',
      textBaseline: 'middle',
      stroke: new ol.style.Stroke({
        color: 'magenta',
        width: 3
      }),
      fill: new ol.style.Fill({
        color: 'rgba(0, 0, 155, 0.3)'
      })
    })
});

iconFeature.setStyle(iconStyle);


var image = new ol.style.Circle({
  radius: 5,
  fill: null,
  stroke: new ol.style.Stroke({color: 'red', width: 1})
});

var styles = {
  'Point': [new ol.style.Style({
    image: image
  })],
  'LineString': [new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'green',
      lineDash: [4],
      width: 1
    })
  })],
  'MultiLineString': [new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'green',
      width: 1
    })
  })],
  'MultiPoint': [new ol.style.Style({
    image: image,
    text: new ol.style.Text({
      text: 'MP',
      stroke: new ol.style.Stroke({
        color: 'purple'
      })
    })
  })],
  'MultiPolygon': [new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'yellow',
      width: 1
    }),
    fill: new ol.style.Fill({
      color: 'rgba(255, 255, 0, 0.1)'
    })
  })],
  'Polygon': [new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'blue',
      lineDash: [4],
      width: 3
    }),
    fill: new ol.style.Fill({
      color: 'rgba(0, 0, 255, 0.1)'
    })
  })],
  'GeometryCollection': [new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'magenta',
      width: 2
    }),
    fill: new ol.style.Fill({
      color: 'magenta'
    }),
    image: new ol.style.Circle({
      radius: 10, // pixels
      fill: null,
      stroke: new ol.style.Stroke({
        color: 'magenta'
      })
    })
  })],
  'Circle': [new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'red',
      width: 2
    }),
    fill: new ol.style.Fill({
      color: 'rgba(255,0,0,0.2)'
    })
  })]
};

var styleFunction = function(feature, resolution) {
  var geo = feature.getGeometry();
  // always assign a style to prevent feature skipping
  return geo ? styles[geo.getType()] : styles['Point'];
};

var vectorSource = new ol.source.GeoJSON(
    /** @type {olx.source.GeoJSONOptions} */ ({
      object: {
        'type': 'FeatureCollection',
        'crs': {
          'type': 'name',
          'properties': {
            'name': 'EPSG:3857'
          }
        },
        'features': [
          {
            'type': 'Feature',
            'geometry': null,
            'properties': {
              'type': 'without geometry as allowed in spec',
            }
          },
          {
            'type': 'Feature',
            'geometry': {
              'type': 'Point',
              'coordinates': [0, 0, 1e5]
            }
          },
          {
            'type': 'Feature',
            'geometry': {
              'type': 'LineString',
              'coordinates': [
                [1e5, 1e5, 1],
                [2e5, 2e5, 100000],
                [3e5, 3e5, 1000],
                [4e5, 4e5, 100000],
                [5e5, 5e5, 100],
                [6e5, 6e5, 100000],
                [7e5, 7e5, 1]
              ]
            }
          },
          {
            'type': 'Feature',
            'geometry': {
              'type': 'LineString',
              'coordinates': [[4e6, -2e6, 100000], [8e6, 2e6, 200000]]
            }
          },
          {
            'type': 'Feature',
            'geometry': {
              'type': 'LineString',
              'coordinates': [[4e6, 2e6], [8e6, -2e6]]
            }
          },
          {
            'type': 'Feature',
            'geometry': {
              'type': 'Polygon',
              'coordinates': [
                [[-5e6, -1e6, 1e6], [-4e6, 1e6, 1e6], [-3e6, -1e6, 1e6]]
              ]
            }
          },
          {
            'type': 'Feature',
            'geometry': {
              'type': 'MultiLineString',
              'coordinates': [
                [[-1e6, -7.5e5], [-1e6, 7.5e5]],
                [[1e6, -7.5e5], [1e6, 7.5e5]],
                [[-7.5e5, -1e6], [7.5e5, -1e6]],
                [[-7.5e5, 1e6], [7.5e5, 1e6]]
              ]
            }
          },
          {
            'type': 'Feature',
            'geometry': {
              'type': 'MultiPolygon',
              'coordinates': [
                [[
                  [-5e6, 6e6, 8e5],
                  [-5e6, 8e6, 8e5],
                  [-3e6, 8e6, 8e5],
                  [-3e6, 6e6, 8e5]
                ]],
                [[[-2e6, 6e6, 4e5], [-2e6, 8e6, 1e5], [0, 8e6, 0], [0, 6e6, 0]]],
                [[[1e6, 6e6, 1e5], [1e6, 8e6, 0], [3e6, 8e6, 0], [3e6, 6e6, 0]]]
              ]
            }
          },
          {
            'type': 'Feature',
            'geometry': {
              'type': 'MultiPoint',
              'coordinates': [
                [-5e6, 6e6, 8e5],
                [-2e6, 6e6, 4e5],
                [1e6, 6e6, 1e5]
              ]
            }
          },
          {
            'type': 'Feature',
            'geometry': {
              'type': 'GeometryCollection',
              'geometries': [
                {
                  'type': 'LineString',
                  'coordinates': [[-5e6, -5e6], [0, -5e6]]
                },
                {
                  'type': 'Point',
                  'coordinates': [4e6, -5e6]
                },
                {
                  'type': 'Polygon',
                  'coordinates': [[[1e6, -6e6], [2e6, -4e6], [3e6, -6e6]]]
                }
              ]
            }
          }
        ]
      }
    }));

var theCircle = new ol.Feature(new ol.geom.Circle([5e6, 7e6, 5e5], 1e6));

var vectorLayer = new ol.layer.Vector({
  source: vectorSource,
  style: styleFunction
});


var vectorSource2 = new ol.source.Vector({
  features: [iconFeature]
});

var vectorLayer2 = new ol.layer.Vector({
  source: vectorSource2
});

var dragAndDropInteraction = new ol.interaction.DragAndDrop({
  formatConstructors: [
    ol.format.GPX,
    ol.format.GeoJSON,
    ol.format.IGC,
    ol.format.KML,
    ol.format.TopoJSON
  ]
});



var map = new ol.Map({
  interactions: ol.interaction.defaults().extend([dragAndDropInteraction]),
  layers: [
    new ol.layer.Tile({
      source: new ol.source.BingMaps({
        key: 'Ak-dzM4wZjSqTlzveKz5u0d4IQ4bRzVI309GxmkgSVr1ewS6iPSrOvOKhA-CJlm3',
        imagerySet: 'Aerial'
      })
    }),
    vectorLayer,
    vectorLayer2
  ],
  target: 'map2d',
  controls: ol.control.defaults({
    attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
      collapsible: false
    })
  }),
  view: new ol.View({
    center: [0, 0],
    zoom: 2
  })
});

dragAndDropInteraction.on('addfeatures', function(event) {
  var vectorSource = new ol.source.Vector({
    features: event.features,
    projection: event.projection
  });
  map.getLayers().push(new ol.layer.Vector({
    source: vectorSource,
    style: styleFunction
  }));
  var view = map.getView();
  view.fitExtent(
      vectorSource.getExtent(), /** @type {ol.Size} */ (map.getSize()));
});


var ol3d = new olcs.OLCesium({map: map, target: 'map3d'});
var scene = ol3d.getCesiumScene();
var terrainProvider = new Cesium.CesiumTerrainProvider({
  url: '//cesiumjs.org/stk-terrain/tilesets/world/tiles'
});
scene.terrainProvider = terrainProvider;
ol3d.setEnabled(true);

var csLabels = new Cesium.LabelCollection();
csLabels.add({
  position: Cesium.Cartesian3.fromRadians(20, 20, 0),
  text: 'Pre-existing primitive'
});
scene.primitives.add(csLabels);

// Adding a feature after the layer has been synchronized.
vectorSource.addFeature(theCircle);

var hasTheVectorLayer = true;
function addOrRemoveOneVectorLayer() {
  if (hasTheVectorLayer) {
    map.getLayers().remove(vectorLayer);
  } else {
    map.getLayers().insertAt(1, vectorLayer);
  }
  hasTheVectorLayer = !hasTheVectorLayer;
}

function addOrRemoveOneFeature() {
  var count = vectorSource2.getFeatures().length;
  if (count === 0) {
    vectorSource2.addFeature(iconFeature);
  } else {
    vectorSource2.removeFeature(iconFeature);
  }
}

var oldStyle = new ol.style.Style({
  stroke: new ol.style.Stroke({
    color: 'blue',
    width: 2
  }),
  fill: new ol.style.Fill({
    color: 'green'
  })
});
function toggleStyle() {
  var swap = theCircle.getStyle();
  theCircle.setStyle(oldStyle);
  oldStyle = swap;
}
