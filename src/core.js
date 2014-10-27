goog.provide('olcs.core');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('ol.extent');
goog.require('ol.geom.SimpleGeometry');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.proj');
goog.require('ol.source.TileImage');
goog.require('ol.source.WMTS');
goog.require('ol.style.Style');
goog.require('olcs.core.OLImageryProvider');
goog.require('olcs.core.OlLayerPrimitive');



(function() {


  /**
   * -1 when not initialized.
   * @type {number}
   */
  olcs.core.glAliasedLineWidthRange = -1;


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
    var targetb = ellipsoid.cartographicToCartesian(target);

    var position = camera.position;
    var up = new Cesium.Cartesian3();
    ellipsoid.geocentricSurfaceNormal(position, up);

    camera.lookAt(position, targetb, up);
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
      var ext = ol.proj.transformExtent(extent, projection, 'EPSG:4326');
      return Cesium.Rectangle.fromDegrees(ext[0], ext[1], ext[2], ext[3]);
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
   * @param {ol.Coordinate} coordinate Ol3 coordinate.
   * @return {!Cesium.Cartesian3} Cesium cartesian coordinate
   * @api
   */
  olcs.core.ol4326CoordinateToCesiumCartesian = function(coordinate) {
    var coo = coordinate;
    goog.isDefAndNotNull(coo);
    return coo.length > 2 ?
        Cesium.Cartesian3.fromDegrees(coo[0], coo[1], coo[2]) :
        Cesium.Cartesian3.fromDegrees(coo[0], coo[1]);
  };


  /**
   * Convert an array of 2D or 3D OpenLayers coordinates to Cesium.
   * @param {Array.<!ol.Coordinate>} coordinates Ol3 coordinates.
   * @return {!Array.<Cesium.Cartesian3>} Cesium cartesian coordinates
   * @api
   */
  olcs.core.ol4326CoordinateArrayToCsCartesians = function(coordinates) {
    goog.asserts.assert(coordinates !== null);
    var toCartesian = olcs.core.ol4326CoordinateToCesiumCartesian;
    var cartesians = [];
    for (var i = 0; i < coordinates.length; ++i) {
      cartesians.push(toCartesian(coordinates[i]));
    }
    return cartesians;
  };


  /**
   * Convert an OpenLayers geometry to 4326 projection.
   * The geometry will be cloned only when reprojection is required.
   * @param {!T} geometry
   * @param {!ol.proj.ProjectionLike} projection
   * @return {!T}
   * @template T
   */
  var olGeometryCloneTo4326 = function(geometry, projection) {
    goog.asserts.assert(goog.isDef(projection));

    var proj4326 = ol.proj.get('EPSG:4326');
    var proj = ol.proj.get(projection);
    if (proj !== proj4326) {
      geometry = geometry.clone();
      geometry.transform(proj, proj4326);
    }
    return geometry;
  };


  /**
   * Basics primitive creation using a color attribute.
   * Note that Cesium has 'interior' and outline geometries.
   * @param {!Cesium.Geometry} geometry
   * @param {!Cesium.Color} color
   * @param {number=} opt_lineWidth
   * @return {!Cesium.Primitive}
   */
  var createColoredPrimitive = function(geometry, color, opt_lineWidth) {
    var createInstance = function(geometry, color) {
      return new Cesium.GeometryInstance({
        // always update Cesium externs before adding a property
        geometry: geometry,
        attributes: {
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(color)
        }
      });
    };

    var options = {
      // always update Cesium externs before adding a property
      flat: true, // work with all geometries
      renderState: {
        depthTest: {
          enabled: true
        }
      }
    };

    if (goog.isDef(opt_lineWidth)) {
      if (!options.renderState) {
        options.renderState = {};
      }
      options.renderState.lineWidth = opt_lineWidth;
    }
    var appearance = new Cesium.PerInstanceColorAppearance(options);

    var instances = createInstance(geometry, color);

    var primitive = new Cesium.Primitive({
      // always update Cesium externs before adding a property
      geometryInstances: instances,
      appearance: appearance
    });

    return primitive;
  };


  /**
   * Return the fill or stroke color from a plain ol style.
   * @param {!ol.style.Style|ol.style.Text} style
   * @param {boolean} outline
   * @return {!Cesium.Color}
   */
  var extractColorFromOlStyle = function(style, outline) {
    var fillColor = style.getFill() ? style.getFill().getColor() : null;
    var strokeColor = style.getStroke() ? style.getStroke().getColor() : null;

    var olColor = 'black';
    if (strokeColor && outline) {
      olColor = strokeColor;
    } else if (fillColor) {
      olColor = fillColor;
    }

    return convertOlColorToCesium(olColor);
  };


  /**
   * Return the width of stroke from a plain ol style.
   * Use GL aliased line width range constraint.
   * @param {!ol.style.Style|ol.style.Text} style
   * @return {number}
   */
  var extractLineWidthFromOlStyle = function(style) {
    if (olcs.core.glAliasedLineWidthRange == -1) {
      throw new Error('olcs.core.glAliasedLineWidthRange must be initialized ' +
          'using Cesium.Scene.maximumAliasedLineWidth');
    }
    var width = style.getStroke() ? style.getStroke().getWidth() : 1;
    return Math.min(width, olcs.core.glAliasedLineWidthRange);
  };


  /**
   * Create a primitive collection out of two Cesium geometries.
   * Only the OpenLayers style colors will be used.
   * @param {!Cesium.Geometry} fillGeometry
   * @param {!Cesium.Geometry} outlineGeometry
   * @param {!ol.style.Style} olStyle
   * @return {!Cesium.PrimitiveCollection}
   */
  var wrapFillAndOutlineGeometries = function(fillGeometry, outlineGeometry,
      olStyle) {
    var fillColor = extractColorFromOlStyle(olStyle, false);
    var outlineColor = extractColorFromOlStyle(olStyle, true);

    var primitives = new Cesium.PrimitiveCollection();
    if (olStyle.getFill()) {
      var p = createColoredPrimitive(fillGeometry, fillColor);
      primitives.add(p);
    }

    if (olStyle.getStroke()) {
      var width = extractLineWidthFromOlStyle(olStyle);
      var p = createColoredPrimitive(outlineGeometry, outlineColor, width);
      primitives.add(p);
    }

    return primitives;
  };



  // Geometry converters
  /**
   * Create a Cesium primitive if style has a text component.
   * Eventually return a PrimitiveCollection including current primitive.
   * @param {!ol.geom.Geometry} geometry
   * @param {!ol.style.Style} style
   * @param {!Cesium.Primitive} primitive current primitive
   * @return {!Cesium.PrimitiveCollection}
   */
  var addTextStyle = function(geometry, style, primitive) {
    var primitives;
    if (!(primitive instanceof Cesium.PrimitiveCollection)) {
      var primitives = new Cesium.PrimitiveCollection();
      primitives.add(primitive);
    } else {
      primitives = primitive;
    }

    if (!style.getText()) {
      return primitives;
    }

    var text = /** @type {!ol.style.Text} */ (style.getText());
    var label = olcs.core.olGeometry4326TextPartToCesium(geometry, text);
    if (label) {
      primitives.add(label);
    }
    return primitives;
  };


  /**
   * Convert an OpenLayers circle geometry to Cesium.
   * @param {!ol.geom.Circle} olGeometry Ol3 circle geometry.
   * @param {!ol.proj.ProjectionLike} projection
   * @param {!ol.style.Style} olStyle
   * @return {!Cesium.PrimitiveCollection} primitives
   * @api
   */
  olcs.core.olCircleGeometryToCesium = function(olGeometry, projection,
      olStyle) {
    olGeometry = olGeometryCloneTo4326(olGeometry, projection);
    goog.asserts.assert(olGeometry.getType() == 'Circle');

    // ol.Coordinate
    var center = olGeometry.getCenter();
    var height = center.length == 3 ? center[2] : 0.0;
    var point = center.slice();
    point[0] += olGeometry.getRadius();

    // Cesium
    center = olcs.core.ol4326CoordinateToCesiumCartesian(center);
    point = olcs.core.ol4326CoordinateToCesiumCartesian(point);

    // Accurate computation of straight distance
    var radius = Cesium.Cartesian3.distance(center, point);

    var fillGeometry = new Cesium.CircleGeometry({
      // always update Cesium externs before adding a property
      center: center,
      radius: radius,
      height: height
    });

    var outlineGeometry = new Cesium.CircleOutlineGeometry({
      // always update Cesium externs before adding a property
      center: center,
      radius: radius,
      height: height
    });

    var wrap = wrapFillAndOutlineGeometries;
    var primitives = wrap(fillGeometry, outlineGeometry, olStyle);

    return addTextStyle(olGeometry, olStyle, primitives);
  };


  /**
   * Convert an OpenLayers line string geometry to Cesium.
   * @param {!ol.geom.LineString} olGeometry Ol3 line string geometry.
   * @param {!ol.proj.ProjectionLike} projection
   * @param {!ol.style.Style} olStyle
   * @return {!Cesium.PrimitiveCollection} primitives
   * @api
   */
  olcs.core.olLineStringGeometryToCesium = function(olGeometry, projection,
      olStyle) {

    olGeometry = olGeometryCloneTo4326(olGeometry, projection);
    goog.asserts.assert(olGeometry.getType() == 'LineString');

    var positions = olcs.core.ol4326CoordinateArrayToCsCartesians(
        olGeometry.getCoordinates());

    var appearance = new Cesium.PolylineMaterialAppearance({
      // always update Cesium externs before adding a property
      material: olcs.core.olStyleToCesium(olStyle, true)
    });

    // Handle both color and width
    var outlineGeometry = new Cesium.PolylineGeometry({
      // always update Cesium externs before adding a property
      positions: positions,
      vertexFormat: appearance.vertexFormat
    });

    var outlinePrimitive = new Cesium.Primitive({
      // always update Cesium externs before adding a property
      geometryInstances: new Cesium.GeometryInstance({
        geometry: outlineGeometry
      }),
      appearance: appearance
    });

    return addTextStyle(olGeometry, olStyle, outlinePrimitive);
  };


  /**
   * Convert an OpenLayers polygon geometry to Cesium.
   * @param {!ol.geom.Polygon} olGeometry Ol3 polygon geometry.
   * @param {!ol.proj.ProjectionLike} projection
   * @param {!ol.style.Style} olStyle
   * @return {!Cesium.PrimitiveCollection} primitives
   * @api
   */
  olcs.core.olPolygonGeometryToCesium = function(olGeometry, projection,
      olStyle) {

    olGeometry = olGeometryCloneTo4326(olGeometry, projection);
    goog.asserts.assert(olGeometry.getType() == 'Polygon');

    var rings = olGeometry.getLinearRings();
    // always update Cesium externs before adding a property
    var hierarchy = {};
    var polygonHierarchy = hierarchy;
    goog.asserts.assert(rings.length > 0);

    for (var i = 0; i < rings.length; ++i) {
      var olPos = rings[i].getCoordinates();
      var positions = olcs.core.ol4326CoordinateArrayToCsCartesians(olPos);
      goog.asserts.assert(positions && positions.length > 0);
      if (i == 0) {
        hierarchy.positions = positions;
      } else {
        hierarchy.holes = {
          // always update Cesium externs before adding a property
          positions: positions
        };
        hierarchy = hierarchy.holes;
      }
    }

    var fillGeometry = new Cesium.PolygonGeometry({
      // always update Cesium externs before adding a property
      polygonHierarchy: polygonHierarchy,
      perPositionHeight: true
    });

    var width = extractLineWidthFromOlStyle(olStyle);
    var outlineGeometry = new Cesium.PolygonOutlineGeometry({
      // always update Cesium externs before adding a property
      polygonHierarchy: hierarchy,
      perPositionHeight: true,
      width: width
    });

    var primitives = wrapFillAndOutlineGeometries(
        fillGeometry, outlineGeometry, olStyle);

    return addTextStyle(olGeometry, olStyle, primitives);
  };


  /**
   * Convert a point geometry to a Cesium BillboardCollection.
   * @param {!ol.geom.Point} geometry
   * @param {!ol.proj.ProjectionLike} projection
   * @param {!ol.style.Style} style
   * @param {!Cesium.BillboardCollection} billboards
   * @param {Object.<!ol.Feature,!Cesium.Primitive|!Cesium.Billboard>=} opt_featureToCesiumMap
   * @return {Cesium.Primitive} primitives
   * @api
   */
  olcs.core.olPointGeometryToCesium = function(geometry, projection, style,
      billboards, featureId, opt_featureToCesiumMap) {
    goog.asserts.assert(geometry.getType() == 'Point');
    geometry = olGeometryCloneTo4326(geometry, projection);

    var imageStyle = style.getImage();
    var image = imageStyle.getImage(1); // get normal density
    var isImageLoaded = function(image) {
      return image.src != '' &&
          image.naturalHeight != 0 &&
          image.naturalWidth != 0 &&
          image.complete;
    };
    var reallyCreateBillboard = function() {
      if (goog.isNull(image) ||
          !(image instanceof HTMLCanvasElement || image instanceof Image)) {
        return;
      }
      var center = geometry.getCoordinates();
      var position = olcs.core.ol4326CoordinateToCesiumCartesian(center);
      var bb = billboards.add({
        // always update Cesium externs before adding a property
        image: image,
        position: position
      });
      bb.olFeatureId = featureId;
      if (goog.isDef(opt_featureToCesiumMap)) {
        opt_featureToCesiumMap[featureId] = bb;
      }
    };

    if (image instanceof Image && !isImageLoaded(image)) {
      // Cesium requires the image to be loaded
      var listener = function() {
        reallyCreateBillboard();
      };

      goog.events.listenOnce(image, 'load', listener);
    } else {
      reallyCreateBillboard();
    }

    if (style.getText()) {
      return addTextStyle(geometry, style, billboards);
    } else {
      return null;
    }
  };


  /**
   * Convert an OpenLayers multi-something geometry to Cesium.
   * @param {!ol.geom.Geometry} geometry Ol3 geometry.
   * @param {!ol.proj.ProjectionLike} projection
   * @param {!ol.style.Style} olStyle
   * @param {?} featureId
   * @return {!Cesium.Primitive} primitives
   * @api
   */
  olcs.core.olMultiGeometryToCesium = function(geometry, projection,
      olStyle, featureId) {
    // Do not reproject to 4326 now because it will be done later.

    // FIXME: would be better to combine all child geometries in one primitive
    // instead we create n primitives for simplicity.
    var accumulate = function(geometries, functor) {
      var primitives = new Cesium.PrimitiveCollection();
      goog.array.forEach(geometries, function(geometry) {
        primitives.add(functor(geometry, projection, olStyle));
      });
      return primitives;
    };

    var subgeos;
    switch (geometry.getType()) {
      case 'MultiPoint':
        geometry = /** @type {!ol.geom.MultiPoint} */ (geometry);
        subgeos = geometry.getPoints();
        var fn = olcs.core.olPointGeometryToCesium;
        var billboards = new Cesium.BillboardCollection();
        if (olStyle.getText()) {
          var primitives = new Cesium.PrimitiveCollection();
          goog.array.forEach(subgeos, function(geometry) {
            goog.asserts.assert(geometry);
            var result = fn(geometry, projection, olStyle, billboards,
                featureId);
            if (result) {
              primitives.add(result);
            }
          });
          return primitives;
        } else {
          goog.array.forEach(subgeos, function(geometry) {
            goog.asserts.assert(!goog.isNull(geometry));
            fn(geometry, projection, olStyle, billboards, featureId);
          });
          return billboards;
        }
      case 'MultiLineString':
        geometry = /** @type {!ol.geom.MultiLineString} */ (geometry);
        subgeos = geometry.getLineStrings();
        return accumulate(subgeos, olcs.core.olLineStringGeometryToCesium);
      case 'MultiPolygon':
        geometry = /** @type {!ol.geom.MultiPolygon} */ (geometry);
        subgeos = geometry.getPolygons();
        return accumulate(subgeos, olcs.core.olPolygonGeometryToCesium);
      default:
        goog.asserts.fail('Unhandled multi geometry type' + geometry.getType());
    }
  };


  /**
   * Convert an OpenLayers text style to Cesium.
   * @param {!ol.geom.Geometry} geometry
   * @param {!ol.style.Text} style
   * @return {Cesium.LabelCollection} Cesium primitive
   * @api
   */
  olcs.core.olGeometry4326TextPartToCesium = function(geometry, style) {
    var text = style.getText();
    goog.asserts.assert(goog.isDef(text));


    var primitives = new Cesium.LabelCollection();
    // TODO: export and use the text draw position from ol3 .
    // See src/ol/render/vector.js
    var extentCenter = ol.extent.getCenter(geometry.getExtent());
    if (geometry instanceof ol.geom.SimpleGeometry) {
      var first = geometry.getFirstCoordinate();
      extentCenter[2] = first.length == 3 ? first[2] : 0.0;
    }
    var position = olcs.core.ol4326CoordinateToCesiumCartesian(extentCenter);

    primitives.modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
        position);
    var options = /** @type {Cesium.optionsLabelCollection} */ ({});
    options.text = text;

    var offsetX = style.getOffsetX();
    var offsetY = style.getOffsetY();
    if (offsetX != 0 && offsetY != 0) {
      var offset = new Cesium.Cartesian2(offsetX, offsetY);
      options.pixelOffset = offset;
    }

    var font = style.getFont();
    if (goog.isDefAndNotNull(font)) {
      options.font = font;
    }

    var labelStyle = undefined;
    if (style.getFill()) {
      options.fillColor = extractColorFromOlStyle(style, false);
      labelStyle = Cesium.LabelStyle.FILL;
    }
    if (style.getStroke()) {
      options.outlineWidth = extractLineWidthFromOlStyle(style);
      options.outlineColor = extractColorFromOlStyle(style, true);
      labelStyle = Cesium.LabelStyle.OUTLINE;
    }
    if (style.getFill() && style.getStroke()) {
      labelStyle = Cesium.LabelStyle.FILL_AND_OUTLINE;
    }
    options.style = labelStyle;

    if (style.getTextAlign()) {
      var horizontalOrigin;
      switch (style.getTextAlign()) {
        case 'center':
          horizontalOrigin = Cesium.HorizontalOrigin.CENTER;
          break;
        case 'left':
          horizontalOrigin = Cesium.HorizontalOrigin.LEFT;
          break;
        case 'right':
          horizontalOrigin = Cesium.HorizontalOrigin.RIGHT;
          break;
        default:
          goog.asserts.fail('unhandled text align ' + style.getTextAlign());
      }
      options.horizontalOrigin = horizontalOrigin;
    }

    if (style.getTextBaseline()) {
      var verticalOrigin;
      switch (style.getTextBaseline()) {
        case 'top':
          verticalOrigin = Cesium.VerticalOrigin.TOP;
          break;
        case 'middle':
          verticalOrigin = Cesium.VerticalOrigin.CENTER;
          break;
        case 'bottom':
          verticalOrigin = Cesium.VerticalOrigin.BOTTOM;
          break;
        case 'alphabetic':
          verticalOrigin = Cesium.VerticalOrigin.TOP;
          break;
        case 'hanging':
          verticalOrigin = Cesium.VerticalOrigin.BOTTOM;
          break;
        default:
          goog.asserts.fail('unhandled baseline ' + style.getTextBaseline());
      }
      options.verticalOrigin = verticalOrigin;
    }


    primitives.add(options);
    return primitives;
  };


  /**
   * @param {ol.Color|string} olColor
   * @return {!Cesium.Color}
   */
  var convertOlColorToCesium = function(olColor) {
    olColor = olColor || 'black';
    if (goog.isArray(olColor)) {
      return new Cesium.Color(
          Cesium.Color.byteToFloat(olColor[0]),
          Cesium.Color.byteToFloat(olColor[1]),
          Cesium.Color.byteToFloat(olColor[2]),
          olColor[3]
      );
    } else if (goog.isString(olColor)) {
      return Cesium.Color.fromCssColorString(olColor);
    }
    goog.asserts.fail('impossible');
  };


  /**
   * Convert an OpenLayers style to a Cesium Material.
   * @param {!ol.style.Style} style
   * @param {boolean} outline
   * @return {Cesium.Material}
   * @api
   */
  olcs.core.olStyleToCesium = function(style, outline) {
    var fill = style.getFill();
    var stroke = style.getStroke();
    if ((outline && !stroke) || (!outline && !fill)) {
      return null; // FIXME use a default style? Developer error?
    }

    var color = outline ? stroke.getColor() : fill.getColor();
    color = convertOlColorToCesium(color);

    if (outline && stroke.getLineDash()) {
      return Cesium.Material.fromType('Stripe', {
        // always update Cesium externs before adding a property
        horizontal: false,
        repeat: 500, // TODO how to calculate this?
        evenColor: color,
        oddColor: new Cesium.Color(0, 0, 0, 0) // transparent
      });
    } else {
      return Cesium.Material.fromType('Color', {
        // always update Cesium externs before adding a property
        color: color
      });
    }

  };


  /**
   * Compute OpenLayers plain style.
   * Evaluates style function, blend arrays, get default style.
   * @param {!ol.Feature} feature
   * @param {ol.style.StyleFunction|undefined} fallbackStyle
   * @param {number} resolution
   * @return {ol.style.Style} null if no style is available
   * @api
   */
  olcs.core.computePlainStyle = function(feature, fallbackStyle, resolution) {
    var featureStyle = feature.getStyleFunction();
    var style;
    if (goog.isDef(featureStyle)) {
      style = featureStyle.call(feature, resolution);
    }
    if (!goog.isDefAndNotNull(style) && goog.isDefAndNotNull(fallbackStyle)) {
      style = fallbackStyle(feature, resolution);
    }

    if (!goog.isDef(style)) {
      // The feature must not be displayed
      return null;
    }

    goog.asserts.assert(goog.isArray(style));
    // FIXME combine materials as in cesium-materials-pack?
    // then this function must return a custom material
    // More simply, could blend the colors like described in
    // http://en.wikipedia.org/wiki/Alpha_compositing
    return style[0];
  };


  /**
   * Convert one OpenLayers feature up to a collection of Cesium primitives.
   * @param {!ol.Feature} feature Ol3 feature.
   * @param {!ol.style.Style} style
   * @param {!olcs.core.OlFeatureToCesiumContext} context
   * @param {!ol.geom.Geometry=} opt_geom Geometry to be converted.
   * @return {Cesium.Primitive} primitives
   * @api
   */
  olcs.core.olFeatureToCesium = function(feature, style, context, opt_geom) {
    var geom = opt_geom || feature.getGeometry();
    var proj = context.projection;

    var id = function(primitives) {
      primitives.olFeatureId = feature.getId();
      return primitives;
    };

    switch (geom.getType()) {
      case 'GeometryCollection':
        var primitives = new Cesium.PrimitiveCollection();
        var collection = /** @type {!ol.geom.GeometryCollection} */ (geom);
        goog.array.forEach(collection.getGeometries(), function(geom) {
          if (geom) {
            var prims = olcs.core.olFeatureToCesium(feature, style, context,
                geom);
            if (prims) {
              primitives.add(prims);
            }
          }
        });
        return id(primitives);
      case 'Point':
        geom = /** @type {!ol.geom.Point} */ (geom);
        var bbs = context.billboards;
        var result = olcs.core.olPointGeometryToCesium(geom, proj, style, bbs,
            feature.getId(), context.featureToCesiumMap);
        if (!result) {
          // no wrapping primitive
          return null;
        } else {
          return id(result);
        }
      case 'Circle':
        geom = /** @type {!ol.geom.Circle} */ (geom);
        return id(olcs.core.olCircleGeometryToCesium(geom, proj, style));
      case 'LineString':
        geom = /** @type {!ol.geom.LineString} */ (geom);
        return id(olcs.core.olLineStringGeometryToCesium(geom, proj, style));
      case 'Polygon':
        geom = /** @type {!ol.geom.Polygon} */ (geom);
        return id(olcs.core.olPolygonGeometryToCesium(geom, proj, style));
      case 'MultiPoint':
      case 'MultiLineString':
      case 'MultiPolygon':
        return id(olcs.core.olMultiGeometryToCesium(geom, proj, style,
            feature.getId()));
      case 'LinearRing':
        goog.asserts.fail('LinearRing should only be part of polygon.');
        break;
      default:
        goog.asserts.fail('ol geom type not handled : ' + geom.getType());
        break;
    }
  };


  /**
   * Convert an OpenLayers vector layer to Cesium primitive collection.
   * For each feature, the associated primitive will be stored in
   * `featurePrimitiveMap`.
   * @param {!ol.layer.Vector} olLayer
   * @param {!ol.View} olView
   * @param {!Object.<!ol.Feature, !Cesium.Primitive>} featurePrimitiveMap
   * @return {!olcs.core.OlLayerPrimitive}
   * @api
   */
  olcs.core.olVectorLayerToCesium = function(olLayer, olView,
      featurePrimitiveMap) {
    var vectorLayer = olLayer;
    var features = vectorLayer.getSource().getFeatures();
    var proj = olView.getProjection();
    var resolution = olView.getResolution();

    if (!goog.isDef(resolution) || !proj) {
      goog.asserts.fail('View not ready');
      // an assertion is not enough for closure to assume resolution and proj
      // are defined
      throw new Error('View not ready');
    }
    var allPrimitives = new olcs.core.OlLayerPrimitive(proj);
    var context = allPrimitives.context;
    for (var i = 0; i < features.length; ++i) {
      var feature = features[i];
      if (!goog.isDefAndNotNull(feature)) {
        continue;
      }
      var layerStyle = vectorLayer.getStyleFunction();
      var style = olcs.core.computePlainStyle(feature, layerStyle, resolution);
      if (!style) {
        // only 'render' features with a style
        continue;
      }
      var primitives = olcs.core.olFeatureToCesium(feature, style, context);
      if (!primitives) continue;
      featurePrimitiveMap[feature] = primitives;
      allPrimitives.add(primitives);
    }

    return allPrimitives;
  };

})();
