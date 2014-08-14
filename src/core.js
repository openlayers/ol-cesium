goog.provide('olcs.core');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('olcs.core.OLImageryProvider');


/**
 * Rotate the camera so that its direction goes through the target point.
 * If a globe is given, the target height is first interpolated from terrain.
 * @param {!Cesium.Camera} camera
 * @param {!Cesium.Cartographic} target
 * @param {Cesium.Globe=} opt_globe
 * @api
 */
olcs.core.lookAt = function(camera, target, opt_globe) {
  if (goog.isDef(opt_globe)) {
    var height = opt_globe.getHeight(target);
    target.height = goog.isDef(height) ? height : 0;
  }

  var ellipsoid = Cesium.Ellipsoid.WGS84;
  target = ellipsoid.cartographicToCartesian(target);

  var position = camera.position;
  var up = new Cesium.Cartesian3();
  ellipsoid.geocentricSurfaceNormal(position, up);

  camera.lookAt(position, target, up);
};


/**
 * Convert an OpenLayers extent to a Cesium rectangle.
 * @param {ol.Extent} extent Extent.
 * @param {ol.proj.ProjectionLike} projection Extent projection.
 * @return {Cesium.Rectangle} The corresponding Cesium rectangle.
 * @api
 */
olcs.core.extentToRectangle = function(extent, projection) {
  if (!goog.isNull(extent) && !goog.isNull(projection)) {
    var llExt = ol.proj.transformExtent(extent, projection, 'EPSG:4326');
    return Cesium.Rectangle.fromDegrees(llExt[0], llExt[1], llExt[2], llExt[3]);
  } else {
    return null;
  }
};


/**
 * Creates Cesium.ImageryLayer best corresponding to the given ol.layer.Layer.
 * Only supports raster layers
 * @param {!ol.layer.Layer} olLayer
 * @param {?ol.proj.Projection} viewProj Projection of the view.
 * @return {?Cesium.ImageryLayer} null if not possible (or supported)
 * @api
 */
olcs.core.tileLayerToImageryLayer = function(olLayer, viewProj) {
  if (!(olLayer instanceof ol.layer.Tile)) {
    return null;
  }

  var provider = null;

  var source = olLayer.getSource();
  // handle special cases before the general synchronization
  if (source instanceof ol.source.WMTS) {
    // WMTS uses different TileGrid which is not currently supported
    return null;
  }
  if (source instanceof ol.source.TileImage) {
    var projection = source.getProjection();

    if (goog.isNull(projection)) {
      // if not explicit, assume the same projection as view
      projection = viewProj;
    } else if (projection !== viewProj) {
      return null; // do not sync layers with projections different than view
    }

    var is3857 = projection === ol.proj.get('EPSG:3857');
    var is4326 = projection === ol.proj.get('EPSG:4326');
    if (is3857 || is4326) {
      provider = new olcs.core.OLImageryProvider(source, viewProj);
    } else {
      return null;
    }
  } else {
    // sources other than TileImage are currently not supported
    return null;
  }

  // the provider is always non-null if we got this far

  var layerOptions = {};

  var ext = olLayer.getExtent();
  if (goog.isDefAndNotNull(ext) && !goog.isNull(viewProj)) {
    layerOptions.rectangle = olcs.core.extentToRectangle(ext, viewProj);
  }

  var cesiumLayer = new Cesium.ImageryLayer(provider, layerOptions);
  return cesiumLayer;
};


/**
 * Synchronizes the layer rendering properties (brightness, contrast, hue,
 * opacity, saturation, visible) to the given Cesium ImageryLayer.
 * @param {!ol.layer.Layer} olLayer
 * @param {!Cesium.ImageryLayer} csLayer
 * @api
 */
olcs.core.updateCesiumLayerProperties = function(olLayer, csLayer) {
  var opacity = olLayer.getOpacity();
  if (goog.isDef(opacity)) {
    csLayer.alpha = opacity;
  }
  var visible = olLayer.getVisible();
  if (goog.isDef(visible)) {
    csLayer.show = visible;
  }

  // saturation and contrast are working ok
  var saturation = olLayer.getSaturation();
  if (goog.isDef(saturation)) {
    csLayer.saturation = saturation;
  }
  var contrast = olLayer.getContrast();
  if (goog.isDef(contrast)) {
    csLayer.contrast = contrast;
  }

  // Cesium actually operates in YIQ space -> hard to emulate
  // The following values are only a rough approximations:

  // The hue in Cesium has different meaning than the OL equivalent.
  // var hue = olLayer.getHue();
  // if (goog.isDef(hue)) {
  //   csLayer.hue = hue;
  // }

  var brightness = olLayer.getBrightness();
  if (goog.isDef(brightness)) {
    // rough estimation
    csLayer.brightness = Math.pow(1 + parseFloat(brightness), 2);
  }
};


/**
 * Convert a 2D or 3D OpenLayers coordinate to Cesium.
 * @param {!ol.coordinate} coordinate Ol3 coordinate
 * @return {Cesium.Cartesian3} Cesium cartesian coordinate
 * @api convenience
 */
olcs.core.ol4326CoordinateToCesiumCartesian = function(coordinate) {
  return coordinate.length > 2 ?
    Cesium.Cartesian3.fromDegrees(coordinate[0], coordinate[1], coordinate[2]) :
    Cesium.Cartesian3.fromDegrees(coordinate[0], coordinate[1]);
};


/**
 * Convert an array of 2D or 3D OpenLayers coordinates to Cesium.
 * @param {!Array.<ol.Coordinate>} coordinates Ol3 coordinates
 * @return {Array.<Cesium.Cartesian3>} Cesium cartesian coordinates
 * @api convenience
 */
olcs.core.ol4326CoordinateArrayToCesiumCartesians = function(coordinates) {
  var toCartesian = olcs.core.ol4326CoordinateToCesiumCartesian;
  var cartesians = [];
  for (var i = 0; i < coordinates.length; ++i) {
    cartesians.push(toCartesian(coordinates[i]));
  }
  return cartesians;
};


/**
 * Convert an Ol3 geometry to 4326 projection.
 * The geometry will be clone only when reprojection is required.
 * @param {!ol.geom.Geometry} geometry
 * @param {!ol.proj.ProjectionLike} projection
 * @return {ol.geom.Geometry}
 */
var olGeometryCloneTo4326 = function(geometry, projection) {
  goog.asserts.assert(goog.isDef(projection));

  var proj4326 = ol.proj.get('EPSG:4326');
  projection = ol.proj.get(projection);
  if (projection !== proj4326) {
    geometry = geometry.clone();
    geometry.transform(projection, proj4326);
  }
  return geometry;
};


/**
 * Basics primitive creation using a color attribute.
 * @param {!ol.geom.Geometry} geometry
 * @param {!Cesium.Color} color
 * @return {Cesium.Primitive}
 */
var createColoredPrimitive = function(geometry, color) {
  var createInstance = function(geometry, color) {
    return new Cesium.GeometryInstance({
      geometry: geometry,
      attributes: {
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(color)
      }
    });
  };

  var appearance = new Cesium.PerInstanceColorAppearance({
    flat: true // work with all geometries
  });

  var instances = [];
  if (goog.isArray(geometry)) {
    geometry.forEach(function(geometry) {
      var instance = createInstance(geometry, color);
      instances.push(instance);
    });
  } else {
    instances = createInstance(geometry, color);
  }

  var primitive = new Cesium.Primitive({
    geometryInstances: instances,
    appearance: appearance
  });

 return primitive;
};


/**
 * Create a primitive collection out of two Cesium geometries.
 * Only the ol3 style colors will be used.
 * @param {!Cesium.Geometry} fillGeometry
 * @param {!Cesium.Geometry} outlineGeometry
 * @param {!ol.style.Style} olStyle
 * @return {Cesium.PrimitiveCollection}
 */
var wrapFillAndOutlineGeometries = function(fillGeometry, outlineGeometry,
    olStyle) {
  var fillColor = extractColorFromOlStyle(olStyle, false);
  var fillPrimitive = createColoredPrimitive(fillGeometry, fillColor);

  var outlineColor = extractColorFromOlStyle(olStyle, true);
  var outlinePrimitive = createColoredPrimitive(outlineGeometry, outlineColor);

  var primitives = new Cesium.PrimitiveCollection();
  primitives.add(fillPrimitive);
  primitives.add(outlinePrimitive);

  return primitives;
};



// Geometry converters

/**
 * Convert an OpenLayers circle geometry to Cesium.
 * @param {!ol.geom.geometry} olGeometry Ol3 circle geometry
 * @param {!ol.projectionLike} projection
 * @param {!ol.style} olStyle
 * @return {Cesium.Geometry|Array.<Cesium.Geometry>} geometries
 */
olcs.core.olCircleGeometryToCesium = function(olGeometry, projection, olStyle) {
  olGeometry = olGeometryCloneTo4326(olGeometry, projection);
  goog.asserts.assert(olGeometry.getType() == 'Circle');

  // ol.coordinate
  var center = olGeometry.getCenter();
  var point = center.slice(); point[0] += olGeometry.getRadius();

  // Cesium
  center = olcs.core.ol4326CoordinateToCesiumCartesian(center);
  point = olcs.core.ol4326CoordinateToCesiumCartesian(point);

  // Accurate computation of straight distance
  var radius = Cesium.Cartesian3.distance(center, point);

  var fillGeometry = new Cesium.CircleGeometry({
    center: center,
    radius: radius
  });

  var outlineGeometry = new Cesium.CircleOutlineGeometry({
    center: center,
    radius: radius
   });

  var wrap = wrapFillAndOutlineGeometries;
  var primitives = wrap(fillGeometry, outlineGeometry, olStyle);

  return addTextStyle(olGeometry, olStyle, primitives);
};


/**
 * Convert an OpenLayers line string geometry to Cesium.
 * @param {!ol.geom.geometry} olGeometry Ol3 line string geometry
 * @param {!ol.projectionLike} projection
 * @param {!ol.style} olStyle
 * @return {Cesium.Geometry|Array.<Cesium.Geometry>} geometries
 */
olcs.core.olLineStringGeometryToCesium = function(olGeometry, projection,
    olStyle) {

  olGeometry = olGeometryCloneTo4326(olGeometry, projection);
  goog.asserts.assert(olGeometry.getType() == 'LineString');

  var positions = olGeometry.getCoordinates();
  positions = olcs.core.ol4326CoordinateArrayToCesiumCartesians(positions);

  var appearance = new Cesium.PolylineMaterialAppearance({
    material: olcs.core.olStyleToCesium(olStyle, true)
  });

  // Handle both color and width
  var outlineGeometry = new Cesium.PolylineGeometry({
    positions: positions,
    vertexFormat: appearance.vertexFormat
  });

  var outlinePrimitive = new Cesium.Primitive({
    geometryInstances: new Cesium.GeometryInstance({
      geometry: outlineGeometry
    }),
    appearance: appearance
  });

  return addTextStyle(olGeometry, olStyle, outlinePrimitive);
};


/**
 * Convert an OpenLayers polygon geometry to Cesium.
 * @param {!ol.geom.Polygon} olGeometry Ol3 polygon geometry
 * @param {!ol.projectionLike} projection
 * @param {!ol.style} olStyle
 * @return {Cesium.Geometry|Array.<Cesium.Geometry>} geometries
 */
olcs.core.olPolygonGeometryToCesium = function(olGeometry, projection,
    olStyle) {

  olGeometry = olGeometryCloneTo4326(olGeometry, projection);
  goog.asserts.assert(olGeometry.getType() == 'Polygon');

  var rings = olGeometry.getLinearRings();
  var hierarchy = {};
  for (var i = 0; i < rings.length; ++i) {
    var positions = rings[i].getCoordinates();
    positions = olcs.core.ol4326CoordinateArrayToCesiumCartesians(positions);
    if (i == 0) {
      hierarchy.positions = positions;
    } else {
      if (goog.isDef(hierarchy.holes)) hierarchy.holes.push(positions);
      else hierarchy.holes = [positions];
    }
  }

  var fillGeometry = new Cesium.PolygonGeometry({
    polygonHierarchy: hierarchy
  });

  var width = olStyle.getStroke() ? olStyle.getStroke().getWidth() : 1;
  var outlineGeometry = new Cesium.PolygonOutlineGeometry({
     polygonHierarchy: hierarchy,
     width: width
  });

  var primitives = wrapFillAndOutlineGeometries(
      fillGeometry, outlineGeometry, olStyle);

  return addTextStyle(olGeometry, olStyle, primitives);
};


/**
 * Convert a point geometry to a Cesium BillboardCollection.
 * @param {!ol.geom.Point} geometry
 * @param {!ol.projectionLike} projection
 * @param {!ol.style.Style} style
 * @return {Cesium.BillboardCollection} primitive
 */
olcs.core.olPointGeometryToCesium = function(geometry, projection, style) {
  goog.asserts.assert(geometry.getType() == 'Point');
  geometry = olGeometryCloneTo4326(geometry, projection);

  var image = extractOlStyleImage(style.getImage());
  goog.asserts.assert(image);
  var color = extractColorFromOlStyle(style);
  var position = ol.extent.getCenter(geometry.getExtent());
  position = olcs.core.ol4326CoordinateToCesiumCartesian(position);

  var billboards = new Cesium.BillboardCollection();
  billboards.add({
   image: image,
//   scaleByDistance: new Cesium.NearFarScalar(1.5e2, 2.0, 1.5e7, 0.5),
   position: position
  });

  return addTextStyle(geometry, style, billboards);
};


/**
 * Convert an OpenLayers multi-something geometry to Cesium.
 * @param {!ol.geom.geometry} geometry Ol3 geometry
 * @param {!ol.projectionLike} projection
 * @param {!ol.style} olStyle
 * @return {Cesium.Geometry|Array.<Cesium.Geometry>} geometries
 */
olcs.core.olMultiGeometryToCesium = function(geometry, projection,
    olStyle) {
  // Do not reproject to 4326 as it will be done further

  // FIXME: would be better to combine all child geometries in one primitive
  // instead we create n primitives for simplicity.
  var accumulate = function(geometries, functor) {
    var primitives = new Cesium.PrimitiveCollection();
    geometries.forEach(function(geometry) {
      primitives.add(functor(geometry, projection, olStyle));
    });
    return primitives;
  };

  switch (geometry.getType()) {
    case 'MultiPoint':
      var subgeos = geometry.getPoints();
      return accumulate(subgeos, olcs.core.olPointGeometryToCesium);
    case 'MultiLineString':
      var subgeos = geometry.getLineStrings();
      return accumulate(subgeos, olcs.core.olLineStringGeometryToCesium);
    case 'MultiPolygon':
      var subgeos = geometry.getPolygons();
      return accumulate(subgeos, olcs.core.olPolygonGeometryToCesium);
    default:
      throw 'Unhandled multi geometry type' + geometry.getType();
  }
};


/**
 * Convert an OpenLayers text style to Cesium.
 * @param {!ol.geom.Geometry} geometry
 * @param {!ol.style} style
 * @return {Cesium.LabelCollection} Cesium primitive
 * @api
 */
olcs.core.olGeometry4326TextPartToCesium = function(geometry, style) {
  goog.asserts.assert(style instanceof ol.style.Text);

  var text = style.getText();
  if (!goog.isDef(text)) return;

  var color = extractColorFromOlStyle(style);

  var primitives = new Cesium.LabelCollection();
  // TODO: export and use the text draw position from ol3 .
  // See src/ol/render/vector.js
  var position = ol.extent.getCenter(geometry.getExtent());
  position = olcs.core.ol4326CoordinateToCesiumCartesian(position);

  // TODO: handle the other parameters of ol.style.Text
  primitives.modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(position);
  primitives.add({
    positions: Cesium.Cartesian3.ZERO,
    horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
    verticalOrigin: Cesium.VerticalOrigin.CENTER,
    fillColor: color,
//    scaleByDistance: new Cesium.NearFarScalar(1.5e2, 2.0, 1.5e7, 0.5),
    text: style.getText()
  });
  return primitives;
};




var addTextStyle = function(geometry, style, primitive) {
  style = style.getText();
  if (!style) return primitive;
  if (!(primitive instanceof Cesium.PrimitiveCollection)) {
    var primitives = new Cesium.Cesium.PrimitiveCollection();
    primitives.add(primitive);
    primitive = primitives;
  }
  primitive.add(olcs.core.olGeometry4326TextPartToCesium(geometry, style));
  return primitive;
};


/**
 * Extract the image from an OpenLayers style.
 * Eventually renders the style in a canvas.
 * @param {!ol.style} style
 * @return {canvas |image} raster
 */
var extractOlStyleImage = function(style) {
  if (style instanceof ol.style.Circle) {
    // FIXME better use the render method from style
    // no need to duplicate everything here
    var canvas = document.createElement('canvas');
    var radius = style.getRadius();
    canvas.width = 2 * (radius + 1);
    canvas.height = 2 * (radius + 1);
    var context2D = canvas.getContext('2d');
    context2D.beginPath();
    context2D.arc(canvas.width / 2, canvas.height / 2, radius, 0,
      Cesium.Math.TWO_PI, true);
    context2D.closePath();
    if (style.getFill() && style.getFill().getColor()) {
      context2D.fillStyle = style.getFill().getColor();
      context2D.fill();
    }
    if (style.getStroke() && style.getStroke().getColor()) {
      context2D.strokeStyle = style.getStroke().getColor();
      context2D.stroke();
    }
    return canvas;
  } else if (style instanceof ol.style.Icon) {
    var image = style.getImage();
    // when having only src, must get access to ol loading and caching mechanism
    // https://github.com/openlayers/ol3/blob/master/src/ol/style/iconstyle.js#L557
    return image;
  } else throw 'Not handled';
};

/**
 * Convert an OpenLayers style to a Cesium Material.
 * @param {!ol.style.Style} style
 * @param {boolean} outline
 * @return {Cesium.Material}
 */
olcs.core.olStyleToCesium = function(style, outline) {
  var fill = style.getFill();
  var stroke = style.getStroke();
  if ((outline && !stroke) || (!outline && !fill)) return undefined;

  var color = outline ? stroke.getColor() : fill.getColor();
  color = Cesium.Color.fromCssColorString(color);

  if (outline && stroke.getLineDash()) {
    return Cesium.Material.fromType('Stripe', {
      horizontal: false,
      repeat: 500, // how to calculate this?
      evenColor: color,
      oddColor: new Cesium.Color(0, 0, 0, 0) // transparent
    });
  } else {
    return Cesium.Material.fromType('Color', {
      color: color
    });
  }

};

/**
 * Return the fill or stroke color from a plain ol style.
 * @param {!ol.style.Style} style
 * @param {boolean} outline
 * @return {Cesium.Color}
 */
var extractColorFromOlStyle = function(style, outline) {
  var fillColor = style.getFill() ? style.getFill().getColor() : null;
  var strokeColor = style.getStroke() ? style.getStroke().getColor() : null;

  var olColor = 'black';
  if (strokeColor && outline) olColor = strokeColor;
  else if (fillColor) olColor = fillColor;

  return Cesium.Color.fromCssColorString(olColor);
};


/**
 * Compute OpenLayers plain style.
 * Evaluates style function, blend arrays, get default style.
 * @param {!ol.feature.Feature} feature
 * @param {ol.style.Style | Array.<ol.style.Style> | ol.style.StyleFunction | undefined} style
 * @param {number} resolution
 * @return {ol.style.Style}
 * @api
 */
olcs.core.computePlainStyle = function(feature, style, resolution) {
  goog.asserts.assert(goog.isDef(feature));
  if (!goog.isDef(style)) style = feature.getStyle();

  if (!goog.isDef(style)) {
    throw 'Export an accessor for ol3 default style'; // FIXME
  } else if (goog.isFunction(style)) {
    var styles = style(feature, resolution);
    // recurse to handle arrays
    return olcs.core.computePlainStyle(feature, styles, resolution);
  } else if (goog.isArray(style)) {
    // FIXME combine materials as in cesium-materials-pack?
    // then this function must return a custom material
    // More simply, could blend the colors like described in
    // http://en.wikipedia.org/wiki/Alpha_compositing
    return style[0];
  } else {
    goog.asserts.assert(style instanceof ol.style.Style);
    return style;
  }
};


/**
 * Convert one OpenLayers feature up to a collection of Cesium primitives.
 * @param {!ol.feature} feature Ol3 feature
 * @param {ol.style.Style} style Ol3 plain style
 * @param {!ol.projectionLike} projection
 * @param {ol.Geometry=} opt_geometry
 * @return {Cesium.Primitive|Cesium.PrimitiveCollection} primitives
 * @api
 */
olcs.core.olFeatureToCesium = function(feature, style, projection,
    opt_geometry) {
  var geom = feature.getGeometry();
  if (goog.isDef(opt_geometry)) geom = opt_geometry;

  var proj = projection;

  goog.asserts.assert(style instanceof ol.style.Style);

  switch (geom.getType()) {
    case 'GeometryCollection':
      var primitives = new Cesium.PrimitiveCollection();
      geom.getGeometries().forEach(function(geom) {
        var prims = olcs.core.olFeatureToCesium(feature, style, proj, geom);
        if (goog.isDef(prims))
          primitives.add(prims);
        else console.log('A subprimitive was lost');
      });
      return primitives;
    case 'Point':
      return olcs.core.olPointGeometryToCesium(geom, proj, style);
    case 'Circle':
      return olcs.core.olCircleGeometryToCesium(geom, proj, style);
     case 'LineString':
      return olcs.core.olLineStringGeometryToCesium(geom, proj, style);
     case 'Polygon':
      return olcs.core.olPolygonGeometryToCesium(geom, proj, style);
      case 'MultiPoint':
        throw 'generalize single point case';
      case 'MultiLineString':
        return olcs.core.olMultiGeometryToCesium(geom, proj, style);
      case 'MultiPolygon':
        return olcs.core.olMultiGeometryToCesium(geom, proj, style);
      case 'LinearRing':
        throw 'Linear ring geometries should only be part of polygon.';
     default:
       throw 'ol geom type not handled : ' + geom.getType();
  }
};


