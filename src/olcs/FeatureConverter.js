/**
 * @module olcs.FeatureConverter
 */
import olGeomGeometry from 'ol/geom/Geometry.js';
import olStyleIcon from 'ol/style/Icon.js';
import olSourceVector from 'ol/source/Vector.js';
import olSourceCluster from 'ol/source/Cluster.js';
import {circular as olCreateCircularPolygon} from 'ol/geom/Polygon.js';
import {boundingExtent, getCenter} from 'ol/extent.js';
import olGeomSimpleGeometry from 'ol/geom/SimpleGeometry.js';
import olcsCore from './core.js';
import olcsCoreVectorLayerCounterpart from './core/VectorLayerCounterpart.js';
import olcsUtil, {getUid, isGroundPolylinePrimitiveSupported} from './util.js';


/**
 * @typedef {Object} ModelStyle
 * @property {Cesium.Matrix4} [debugModelMatrix]
 * @property {Cesium.ModelFromGltfOptions} cesiumOptions
 */


class FeatureConverter {
  /**
   * Concrete base class for converting from OpenLayers3 vectors to Cesium
   * primitives.
   * Extending this class is possible provided that the extending class and
   * the library are compiled together by the closure compiler.
   * @param {!Cesium.Scene} scene Cesium scene.
   * @constructor
   * @api
   */
  constructor(scene) {

    /**
     * @protected
     */
    this.scene = scene;

    /**
     * Bind once to have a unique function for using as a listener
     * @type {function(ol.source.Vector.Event)}
     * @private
     */
    this.boundOnRemoveOrClearFeatureListener_ = this.onRemoveOrClearFeature_.bind(this);

    /**
     * @type {Cesium.Cartesian3}
     * @private
     */
    this.defaultBillboardEyeOffset_ = new Cesium.Cartesian3(0, 0, 10);
  }

  /**
   * @param {ol.source.Vector.Event} evt
   * @private
   */
  onRemoveOrClearFeature_(evt) {
    const source = evt.target;
    console.assert(source instanceof olSourceVector);

    const cancellers = olcsUtil.obj(source)['olcs_cancellers'];
    if (cancellers) {
      const feature = evt.feature;
      if (feature) {
        // remove
        const id = getUid(feature);
        const canceller = cancellers[id];
        if (canceller) {
          canceller();
          delete cancellers[id];
        }
      } else {
        // clear
        for (const key in cancellers) {
          if (cancellers.hasOwnProperty(key)) {
            cancellers[key]();
          }
        }
        olcsUtil.obj(source)['olcs_cancellers'] = {};
      }
    }
  }

  /**
   * @param {ol.layer.Vector|ol.layer.Image} layer
   * @param {!ol.Feature} feature OpenLayers feature.
   * @param {!Cesium.Primitive|Cesium.Label|Cesium.Billboard} primitive
   * @protected
   */
  setReferenceForPicking(layer, feature, primitive) {
    primitive.olLayer = layer;
    primitive.olFeature = feature;
  }

  /**
   * Basics primitive creation using a color attribute.
   * Note that Cesium has 'interior' and outline geometries.
   * @param {ol.layer.Vector|ol.layer.Image} layer
   * @param {!ol.Feature} feature OpenLayers feature.
   * @param {!ol.geom.Geometry} olGeometry OpenLayers geometry.
   * @param {!Cesium.Geometry} geometry
   * @param {!Cesium.Color} color
   * @param {number=} opt_lineWidth
   * @return {Cesium.Primitive}
   * @protected
   */
  createColoredPrimitive(layer, feature, olGeometry, geometry, color, opt_lineWidth) {
    const createInstance = function(geometry, color) {
      const instance = new Cesium.GeometryInstance({
        // always update Cesium externs before adding a property
        geometry
      });
      if (color && !(color instanceof Cesium.ImageMaterialProperty)) {
        instance.attributes = {
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(color)
        };
      }
      return instance;
    };

    const options = {
      // always update Cesium externs before adding a property
      flat: true, // work with all geometries
      renderState: {
        depthTest: {
          enabled: true
        }
      }
    };

    if (opt_lineWidth !== undefined) {
      if (!options.renderState) {
        options.renderState = {};
      }
      options.renderState.lineWidth = opt_lineWidth;
    }

    const instances = createInstance(geometry, color);

    const heightReference = this.getHeightReference(layer, feature, olGeometry);

    let primitive;

    if (heightReference === Cesium.HeightReference.CLAMP_TO_GROUND) {
      const ctor = instances.geometry.constructor;
      if (ctor && !ctor['createShadowVolume']) {
        return null;
      }
      primitive = new Cesium.GroundPrimitive({
        geometryInstances: instances
      });
    } else {
      primitive = new Cesium.Primitive({
        geometryInstances: instances
      });
    }

    if (color instanceof Cesium.ImageMaterialProperty) {
      const dataUri = color.image.getValue().toDataURL();

      primitive.appearance = new Cesium.MaterialAppearance({
        flat: true,
        renderState: {
          depthTest: {
            enabled: true
          }
        },
        material: new Cesium.Material({
          fabric: {
            type: 'Image',
            uniforms: {
              image: dataUri
            }
          }
        })
      });
    } else {
      primitive.appearance = new Cesium.PerInstanceColorAppearance(options);
    }

    this.setReferenceForPicking(layer, feature, primitive);
    return primitive;
  }

  /**
   * Return the fill or stroke color from a plain ol style.
   * @param {!ol.style.Style|ol.style.Text} style
   * @param {boolean} outline
   * @return {!Cesium.Color}
   * @protected
   */
  extractColorFromOlStyle(style, outline) {
    const fillColor = style.getFill() ? style.getFill().getColor() : null;
    const strokeColor = style.getStroke() ? style.getStroke().getColor() : null;

    let olColor = 'black';
    if (strokeColor && outline) {
      olColor = strokeColor;
    } else if (fillColor) {
      olColor = fillColor;
    }

    return olcsCore.convertColorToCesium(olColor);
  }

  /**
   * Return the width of stroke from a plain ol style.
   * @param {!ol.style.Style|ol.style.Text} style
   * @return {number}
   * @protected
   */
  extractLineWidthFromOlStyle(style) {
    // Handling of line width WebGL limitations is handled by Cesium.
    const width = style.getStroke() ? style.getStroke().getWidth() : undefined;
    return width !== undefined ? width : 1;
  }

  /**
   * Create a primitive collection out of two Cesium geometries.
   * Only the OpenLayers style colors will be used.
   * @param {ol.layer.Vector|ol.layer.Image} layer
   * @param {!ol.Feature} feature OpenLayers feature.
   * @param {!ol.geom.Geometry} olGeometry OpenLayers geometry.
   * @param {!Cesium.Geometry} fillGeometry
   * @param {!Cesium.Geometry} outlineGeometry
   * @param {!ol.style.Style} olStyle
   * @return {!Cesium.PrimitiveCollection}
   * @protected
   */
  wrapFillAndOutlineGeometries(layer, feature, olGeometry, fillGeometry, outlineGeometry, olStyle) {
    const fillColor = this.extractColorFromOlStyle(olStyle, false);
    const outlineColor = this.extractColorFromOlStyle(olStyle, true);

    const primitives = new Cesium.PrimitiveCollection();
    if (olStyle.getFill()) {
      const p1 = this.createColoredPrimitive(layer, feature, olGeometry,
          fillGeometry, fillColor);
      console.assert(!!p1);
      primitives.add(p1);
    }

    if (olStyle.getStroke() && outlineGeometry) {
      const width = this.extractLineWidthFromOlStyle(olStyle);
      const p2 = this.createColoredPrimitive(layer, feature, olGeometry,
          outlineGeometry, outlineColor, width);
      if (p2) {
        // Some outline geometries are not supported by Cesium in clamp to ground
        // mode. These primitives are skipped.
        primitives.add(p2);
      }
    }

    return primitives;
  }

  // Geometry converters
  /**
   * Create a Cesium primitive if style has a text component.
   * Eventually return a PrimitiveCollection including current primitive.
   * @param {ol.layer.Vector|ol.layer.Image} layer
   * @param {!ol.Feature} feature OpenLayers feature..
   * @param {!ol.geom.Geometry} geometry
   * @param {!ol.style.Style} style
   * @param {!Cesium.Primitive} primitive current primitive
   * @return {!Cesium.PrimitiveCollection}
   * @protected
   */
  addTextStyle(layer, feature, geometry, style, primitive) {
    let primitives;
    if (!(primitive instanceof Cesium.PrimitiveCollection)) {
      primitives = new Cesium.PrimitiveCollection();
      primitives.add(primitive);
    } else {
      primitives = primitive;
    }

    if (!style.getText()) {
      return primitives;
    }

    const text = /** @type {!ol.style.Text} */ (style.getText());
    const label = this.olGeometry4326TextPartToCesium(layer, feature, geometry,
        text);
    if (label) {
      primitives.add(label);
    }
    return primitives;
  }

  /**
   * Add a billboard to a Cesium.BillboardCollection.
   * Overriding this wrapper allows manipulating the billboard options.
   * @param {!Cesium.BillboardCollection} billboards
   * @param {!Cesium.optionsBillboardCollectionAdd} bbOptions
   * @param {ol.layer.Vector|ol.layer.Image} layer
   * @param {!ol.Feature} feature OpenLayers feature.
   * @param {!ol.geom.Geometry} geometry
   * @param {!ol.style.Style} style
   * @return {!Cesium.Billboard} newly created billboard
   * @api
   */
  csAddBillboard(billboards, bbOptions, layer, feature, geometry, style) {
    if (!bbOptions.eyeOffset) {
      bbOptions.eyeOffset = this.defaultBillboardEyeOffset_;
    }
    const bb = billboards.add(bbOptions);
    this.setReferenceForPicking(layer, feature, bb);
    return bb;
  }

  /**
   * Convert an OpenLayers circle geometry to Cesium.
   * @param {ol.layer.Vector|ol.layer.Image} layer
   * @param {!ol.Feature} feature OpenLayers feature..
   * @param {!ol.geom.Circle} olGeometry OpenLayers circle geometry.
   * @param {!ol.ProjectionLike} projection
   * @param {!ol.style.Style} olStyle
   * @return {!Cesium.PrimitiveCollection} primitives
   * @api
   */
  olCircleGeometryToCesium(layer, feature, olGeometry, projection, olStyle) {

    olGeometry = olcsCore.olGeometryCloneTo4326(olGeometry, projection);
    console.assert(olGeometry.getType() == 'Circle');

    // ol.Coordinate
    let center = olGeometry.getCenter();
    const height = center.length == 3 ? center[2] : 0.0;
    let point = center.slice();
    point[0] += olGeometry.getRadius();

    // Cesium
    center = olcsCore.ol4326CoordinateToCesiumCartesian(center);
    point = olcsCore.ol4326CoordinateToCesiumCartesian(point);

    // Accurate computation of straight distance
    const radius = Cesium.Cartesian3.distance(center, point);

    const fillGeometry = new Cesium.CircleGeometry({
      // always update Cesium externs before adding a property
      center,
      radius,
      height
    });

    let outlinePrimitive, outlineGeometry;
    if (this.getHeightReference(layer, feature, olGeometry) === Cesium.HeightReference.CLAMP_TO_GROUND) {
      const width = this.extractLineWidthFromOlStyle(olStyle);
      if (width) {
        const circlePolygon = olCreateCircularPolygon(olGeometry.getCenter(), radius);
        const positions = olcsCore.ol4326CoordinateArrayToCsCartesians(circlePolygon.getLinearRing(0).getCoordinates());
        if (!isGroundPolylinePrimitiveSupported(this.scene)) {
          const color = this.extractColorFromOlStyle(olStyle, true);
          outlinePrimitive = this.createStackedGroundCorridors(layer, feature, width, color, positions);
        } else {
          outlinePrimitive = new Cesium.GroundPolylinePrimitive({
            geometryInstances: new Cesium.GeometryInstance({
              geometry: new Cesium.GroundPolylineGeometry({positions, width}),
            }),
            appearance: new Cesium.PolylineMaterialAppearance({
              material: this.olStyleToCesium(feature, olStyle, true),
            }),
            classificationType: Cesium.ClassificationType.TERRAIN,
          });
          outlinePrimitive.readyPromise.then(() => {
            this.setReferenceForPicking(layer, feature, outlinePrimitive._primitive);
          });
        }
      }
    } else {
      outlineGeometry = new Cesium.CircleOutlineGeometry({
        // always update Cesium externs before adding a property
        center,
        radius,
        extrudedHeight: height,
        height
      });
    }

    const primitives = this.wrapFillAndOutlineGeometries(
        layer, feature, olGeometry, fillGeometry, outlineGeometry, olStyle);

    if (outlinePrimitive) {
      primitives.add(outlinePrimitive);
    }
    return this.addTextStyle(layer, feature, olGeometry, olStyle, primitives);
  }

  /**
   * @param {ol.layer.Vector|ol.layer.Image} layer
   * @param {!ol.Feature} feature OpenLayers feature..
   * @param {!number} width The width of the line.
   * @param {!Cesium.Color} color The color of the line.
   * @param {!Array<Cesium.Cartesian3>|Array<Array<Cesium.Cartesian3>>} positions The vertices of the line(s).
   * @return {!Cesium.GroundPrimitive} primitive
   */
  createStackedGroundCorridors(layer, feature, width, color, positions) {
    // Convert positions to an Array if it isn't
    if (!Array.isArray(positions[0])) {
      positions = [positions];
    }
    width = Math.max(3, width); // A <3px width is too small for ground primitives
    const geometryInstances = [];
    let previousDistance = 0;
    // A stack of ground lines with increasing width (in meters) are created.
    // Only one of these lines is displayed at any time giving a feeling of continuity.
    // The values for the distance and width factor are more or less arbitrary.
    // Applications can override this logics by subclassing the FeatureConverter class.
    for (const distance of [1000, 4000, 16000, 64000, 254000, 1000000, 10000000]) {
      width *= 2.14;
      const geometryOptions = {
        // always update Cesium externs before adding a property
        width,
        vertexFormat: Cesium.VertexFormat.POSITION_ONLY
      };
      for (const linePositions of positions) {
        geometryOptions.positions = linePositions;
        geometryInstances.push(new Cesium.GeometryInstance({
          geometry: new Cesium.CorridorGeometry(geometryOptions),
          attributes: {
            color: Cesium.ColorGeometryInstanceAttribute.fromColor(color),
            distanceDisplayCondition: new Cesium.DistanceDisplayConditionGeometryInstanceAttribute(previousDistance, distance - 1)
          }
        }));
      }
      previousDistance = distance;
    }
    return new Cesium.GroundPrimitive({
      // always update Cesium externs before adding a property
      geometryInstances
    });
  }

  /**
   * Convert an OpenLayers line string geometry to Cesium.
   * @param {ol.layer.Vector|ol.layer.Image} layer
   * @param {!ol.Feature} feature OpenLayers feature..
   * @param {!ol.geom.LineString} olGeometry OpenLayers line string geometry.
   * @param {!ol.ProjectionLike} projection
   * @param {!ol.style.Style} olStyle
   * @return {!Cesium.PrimitiveCollection} primitives
   * @api
   */
  olLineStringGeometryToCesium(layer, feature, olGeometry, projection, olStyle) {

    olGeometry = olcsCore.olGeometryCloneTo4326(olGeometry, projection);
    console.assert(olGeometry.getType() == 'LineString');

    const positions = olcsCore.ol4326CoordinateArrayToCsCartesians(olGeometry.getCoordinates());
    const width = this.extractLineWidthFromOlStyle(olStyle);

    let outlinePrimitive;
    const heightReference = this.getHeightReference(layer, feature, olGeometry);

    if (heightReference === Cesium.HeightReference.CLAMP_TO_GROUND && !isGroundPolylinePrimitiveSupported(this.scene)) {
      const color = this.extractColorFromOlStyle(olStyle, true);
      outlinePrimitive = this.createStackedGroundCorridors(layer, feature, width, color, positions);
    } else {
      const appearance = new Cesium.PolylineMaterialAppearance({
        // always update Cesium externs before adding a property
        material: this.olStyleToCesium(feature, olStyle, true)
      });
      const geometryOptions = {
        // always update Cesium externs before adding a property
        positions,
        width,
      };
      const primitiveOptions = {
        // always update Cesium externs before adding a property
        appearance
      };
      if (heightReference === Cesium.HeightReference.CLAMP_TO_GROUND) {
        const geometry = new Cesium.GroundPolylineGeometry(geometryOptions);
        primitiveOptions.geometryInstances = new Cesium.GeometryInstance({
          geometry
        }),
        outlinePrimitive = new Cesium.GroundPolylinePrimitive(primitiveOptions);
        outlinePrimitive.readyPromise.then(() => {
          this.setReferenceForPicking(layer, feature, outlinePrimitive._primitive);
        });
      } else {
        geometryOptions.vertexFormat = appearance.vertexFormat;
        const geometry = new Cesium.PolylineGeometry(geometryOptions);
        primitiveOptions.geometryInstances = new Cesium.GeometryInstance({
          geometry
        }),
        outlinePrimitive = new Cesium.Primitive(primitiveOptions);
      }
    }

    this.setReferenceForPicking(layer, feature, outlinePrimitive);

    return this.addTextStyle(layer, feature, olGeometry, olStyle, outlinePrimitive);
  }

  /**
   * Convert an OpenLayers polygon geometry to Cesium.
   * @param {ol.layer.Vector|ol.layer.Image} layer
   * @param {!ol.Feature} feature OpenLayers feature..
   * @param {!ol.geom.Polygon} olGeometry OpenLayers polygon geometry.
   * @param {!ol.ProjectionLike} projection
   * @param {!ol.style.Style} olStyle
   * @return {!Cesium.PrimitiveCollection} primitives
   * @api
   */
  olPolygonGeometryToCesium(layer, feature, olGeometry, projection, olStyle) {

    olGeometry = olcsCore.olGeometryCloneTo4326(olGeometry, projection);
    console.assert(olGeometry.getType() == 'Polygon');

    const heightReference = this.getHeightReference(layer, feature, olGeometry);

    let fillGeometry, outlineGeometry, outlinePrimitive;
    if ((olGeometry.getCoordinates()[0].length == 5) &&
        (feature.getGeometry().get('olcs.polygon_kind') === 'rectangle')) {
      // Create a rectangle according to the longitude and latitude curves
      const coordinates = olGeometry.getCoordinates()[0];
      // Extract the West, South, East, North coordinates
      const extent = boundingExtent(coordinates);
      const rectangle = Cesium.Rectangle.fromDegrees(extent[0], extent[1],
          extent[2], extent[3]);

      // Extract the average height of the vertices
      let maxHeight = 0.0;
      if (coordinates[0].length == 3) {
        for (let c = 0; c < coordinates.length; c++) {
          maxHeight = Math.max(maxHeight, coordinates[c][2]);
        }
      }

      // Render the cartographic rectangle
      fillGeometry = new Cesium.RectangleGeometry({
        ellipsoid: Cesium.Ellipsoid.WGS84,
        rectangle,
        height: maxHeight
      });

      outlineGeometry = new Cesium.RectangleOutlineGeometry({
        ellipsoid: Cesium.Ellipsoid.WGS84,
        rectangle,
        height: maxHeight
      });
    } else {
      const rings = olGeometry.getLinearRings();
      // always update Cesium externs before adding a property
      const hierarchy = {};
      const polygonHierarchy = hierarchy;
      console.assert(rings.length > 0);

      for (let i = 0; i < rings.length; ++i) {
        const olPos = rings[i].getCoordinates();
        const positions = olcsCore.ol4326CoordinateArrayToCsCartesians(olPos);
        console.assert(positions && positions.length > 0);
        if (i == 0) {
          hierarchy.positions = positions;
        } else {
          if (!hierarchy.holes) {
            hierarchy.holes = [];
          }
          hierarchy.holes.push({
            positions
          });
        }
      }

      fillGeometry = new Cesium.PolygonGeometry({
        // always update Cesium externs before adding a property
        polygonHierarchy,
        perPositionHeight: true
      });

      // Since Cesium doesn't yet support Polygon outlines on terrain yet (coming soon...?)
      // we don't create an outline geometry if clamped, but instead do the polyline method
      // for each ring. Most of this code should be removeable when Cesium adds
      // support for Polygon outlines on terrain.
      if (heightReference === Cesium.HeightReference.CLAMP_TO_GROUND) {
        const width = this.extractLineWidthFromOlStyle(olStyle);
        if (width > 0) {
          const positions = [hierarchy.positions];
          if (hierarchy.holes) {
            for (let i = 0; i < hierarchy.holes.length; ++i) {
              positions.push(hierarchy.holes[i].positions);
            }
          }
          if (!isGroundPolylinePrimitiveSupported(this.scene)) {
            const color = this.extractColorFromOlStyle(olStyle, true);
            outlinePrimitive = this.createStackedGroundCorridors(layer, feature, width, color, positions);
          } else {
            const appearance = new Cesium.PolylineMaterialAppearance({
              // always update Cesium externs before adding a property
              material: this.olStyleToCesium(feature, olStyle, true)
            });
            const geometryInstances = [];
            for (const linePositions of positions) {
              const polylineGeometry = new Cesium.GroundPolylineGeometry({positions: linePositions, width});
              geometryInstances.push(new Cesium.GeometryInstance({
                geometry: polylineGeometry
              }));
            }
            const primitiveOptions = {
              // always update Cesium externs before adding a property
              appearance,
              geometryInstances
            };
            outlinePrimitive = new Cesium.GroundPolylinePrimitive(primitiveOptions);
            outlinePrimitive.readyPromise.then(() => {
              this.setReferenceForPicking(layer, feature, outlinePrimitive._primitive);
            });
          }
        }
      } else {
        // Actually do the normal polygon thing. This should end the removable
        // section of code described above.
        outlineGeometry = new Cesium.PolygonOutlineGeometry({
          // always update Cesium externs before adding a property
          polygonHierarchy: hierarchy,
          perPositionHeight: true
        });
      }
    }

    const primitives = this.wrapFillAndOutlineGeometries(
        layer, feature, olGeometry, fillGeometry, outlineGeometry, olStyle);

    if (outlinePrimitive) {
      primitives.add(outlinePrimitive);
    }

    return this.addTextStyle(layer, feature, olGeometry, olStyle, primitives);
  }

  /**
   * @param {ol.layer.Vector|ol.layer.Image} layer
   * @param {ol.Feature} feature OpenLayers feature..
   * @param {!ol.geom.Geometry} geometry
   * @return {!Cesium.HeightReference}
   * @api
   */
  getHeightReference(layer, feature, geometry) {

    // Read from the geometry
    let altitudeMode = geometry.get('altitudeMode');

    // Or from the feature
    if (altitudeMode === undefined) {
      altitudeMode = feature.get('altitudeMode');
    }

    // Or from the layer
    if (altitudeMode === undefined) {
      altitudeMode = layer.get('altitudeMode');
    }

    let heightReference = Cesium.HeightReference.NONE;
    if (altitudeMode === 'clampToGround') {
      heightReference = Cesium.HeightReference.CLAMP_TO_GROUND;
    } else if (altitudeMode === 'relativeToGround') {
      heightReference = Cesium.HeightReference.RELATIVE_TO_GROUND;
    }

    return heightReference;
  }

  /**
   * Convert a point geometry to a Cesium BillboardCollection.
   * @param {ol.layer.Vector|ol.layer.Image} layer
   * @param {!ol.Feature} feature OpenLayers feature..
   * @param {!ol.geom.Point} olGeometry OpenLayers point geometry.
   * @param {!ol.ProjectionLike} projection
   * @param {!ol.style.Style} style
   * @param {!ol.style.Image} imageStyle
   * @param {!Cesium.BillboardCollection} billboards
   * @param {function(!Cesium.Billboard)=} opt_newBillboardCallback Called when the new billboard is added.
   * @api
   */
  createBillboardFromImage(
      layer,
      feature,
      olGeometry,
      projection,
      style,
      imageStyle,
      billboards,
      opt_newBillboardCallback
  ) {

    if (imageStyle instanceof olStyleIcon) {
      // make sure the image is scheduled for load
      imageStyle.load();
    }

    const image = imageStyle.getImage(1); // get normal density
    const isImageLoaded = function(image) {
      return image.src != '' &&
          image.naturalHeight != 0 &&
          image.naturalWidth != 0 &&
          image.complete;
    };
    const reallyCreateBillboard = (function() {
      if (!image) {
        return;
      }
      if (!(image instanceof HTMLCanvasElement ||
          image instanceof Image ||
          image instanceof HTMLImageElement)) {
        return;
      }
      const center = olGeometry.getCoordinates();
      const position = olcsCore.ol4326CoordinateToCesiumCartesian(center);
      let color;
      const opacity = imageStyle.getOpacity();
      if (opacity !== undefined) {
        color = new Cesium.Color(1.0, 1.0, 1.0, opacity);
      }

      const scale = imageStyle.getScale();
      const heightReference = this.getHeightReference(layer, feature, olGeometry);

      const bbOptions = /** @type {Cesium.optionsBillboardCollectionAdd} */ ({
        // always update Cesium externs before adding a property
        image,
        color,
        scale,
        heightReference,
        position
      });

      // merge in cesium options from openlayers feature
      Object.assign(bbOptions, feature.get('cesiumOptions'));

      if (imageStyle instanceof olStyleIcon) {
        const anchor = imageStyle.getAnchor();
        if (anchor) {
          bbOptions.pixelOffset = new Cesium.Cartesian2((image.width / 2 - anchor[0]) * scale, (image.height / 2 - anchor[1]) * scale);
        }
      }

      const bb = this.csAddBillboard(billboards, bbOptions, layer, feature, olGeometry, style);
      if (opt_newBillboardCallback) {
        opt_newBillboardCallback(bb);
      }
    }).bind(this);

    if (image instanceof Image && !isImageLoaded(image)) {
      // Cesium requires the image to be loaded
      let cancelled = false;
      const source = layer.getSource();
      const canceller = function() {
        cancelled = true;
      };
      source.on(['removefeature', 'clear'],
          this.boundOnRemoveOrClearFeatureListener_);
      let cancellers = olcsUtil.obj(source)['olcs_cancellers'];
      if (!cancellers) {
        cancellers = olcsUtil.obj(source)['olcs_cancellers'] = {};
      }

      const fuid = getUid(feature);
      if (cancellers[fuid]) {
        // When the feature change quickly, a canceller may still be present so
        // we cancel it here to prevent creation of a billboard.
        cancellers[fuid]();
      }
      cancellers[fuid] = canceller;

      const listener = function() {
        image.removeEventListener('load', listener);
        if (!billboards.isDestroyed() && !cancelled) {
          // Create billboard if the feature is still displayed on the map.
          reallyCreateBillboard();
        }
      };

      image.addEventListener('load', listener);
    } else {
      reallyCreateBillboard();
    }
  }

  /**
   * Convert a point geometry to a Cesium BillboardCollection.
   * @param {ol.layer.Vector|ol.layer.Image} layer
   * @param {!ol.Feature} feature OpenLayers feature..
   * @param {!ol.geom.Point} olGeometry OpenLayers point geometry.
   * @param {!ol.ProjectionLike} projection
   * @param {!ol.style.Style} style
   * @param {!Cesium.BillboardCollection} billboards
   * @param {function(!Cesium.Billboard)=} opt_newBillboardCallback Called when
   * the new billboard is added.
   * @return {Cesium.Primitive} primitives
   * @api
   */
  olPointGeometryToCesium(
      layer,
      feature,
      olGeometry,
      projection,
      style,
      billboards,
      opt_newBillboardCallback
  ) {
    console.assert(olGeometry.getType() == 'Point');
    olGeometry = olcsCore.olGeometryCloneTo4326(olGeometry, projection);

    let modelPrimitive = null;
    const imageStyle = style.getImage();
    if (imageStyle) {
      const olcsModelFunction = /** @type {function():olcsx.ModelStyle} */ (olGeometry.get('olcs_model') || feature.get('olcs_model'));
      if (olcsModelFunction) {
        const olcsModel = olcsModelFunction();
        const options = /** @type {Cesium.ModelFromGltfOptions} */ (Object.assign({}, {scene: this.scene}, olcsModel.cesiumOptions));
        const model = Cesium.Model.fromGltf(options);
        modelPrimitive = new Cesium.PrimitiveCollection();
        modelPrimitive.add(model);
        if (olcsModel.debugModelMatrix) {
          modelPrimitive.add(new Cesium.DebugModelMatrixPrimitive({
            modelMatrix: olcsModel.debugModelMatrix
          }));
        }
      } else {
        this.createBillboardFromImage(layer, feature, olGeometry, projection, style, imageStyle, billboards, opt_newBillboardCallback);
      }
    }

    if (style.getText()) {
      return this.addTextStyle(layer, feature, olGeometry, style, modelPrimitive || new Cesium.Primitive());
    } else {
      return modelPrimitive;
    }
  }

  /**
   * Convert an OpenLayers multi-something geometry to Cesium.
   * @param {ol.layer.Vector|ol.layer.Image} layer
   * @param {!ol.Feature} feature OpenLayers feature..
   * @param {!ol.geom.Geometry} geometry OpenLayers geometry.
   * @param {!ol.ProjectionLike} projection
   * @param {!ol.style.Style} olStyle
   * @param {!Cesium.BillboardCollection} billboards
   * @param {function(!Cesium.Billboard)=} opt_newBillboardCallback Called when
   * the new billboard is added.
   * @return {Cesium.Primitive} primitives
   * @api
   */
  olMultiGeometryToCesium(
      layer,
      feature,
      geometry,
      projection,
      olStyle,
      billboards,
      opt_newBillboardCallback
  ) {
    // Do not reproject to 4326 now because it will be done later.

    // FIXME: would be better to combine all child geometries in one primitive
    // instead we create n primitives for simplicity.
    const accumulate = function(geometries, functor) {
      const primitives = new Cesium.PrimitiveCollection();
      geometries.forEach((geometry) => {
        primitives.add(functor(layer, feature, geometry, projection, olStyle));
      });
      return primitives;
    };

    let subgeos;
    switch (geometry.getType()) {
      case 'MultiPoint':
        geometry = /** @type {!ol.geom.MultiPoint} */ (geometry);
        subgeos = geometry.getPoints();
        if (olStyle.getText()) {
          const primitives = new Cesium.PrimitiveCollection();
          subgeos.forEach((geometry) => {
            console.assert(geometry);
            const result = this.olPointGeometryToCesium(layer, feature, geometry,
                projection, olStyle, billboards, opt_newBillboardCallback);
            if (result) {
              primitives.add(result);
            }
          });
          return primitives;
        } else {
          subgeos.forEach((geometry) => {
            console.assert(geometry);
            this.olPointGeometryToCesium(layer, feature, geometry, projection,
                olStyle, billboards, opt_newBillboardCallback);
          });
          return null;
        }
      case 'MultiLineString':
        geometry = /** @type {!ol.geom.MultiLineString} */ (geometry);
        subgeos = geometry.getLineStrings();
        return accumulate(subgeos, this.olLineStringGeometryToCesium.bind(this));
      case 'MultiPolygon':
        geometry = /** @type {!ol.geom.MultiPolygon} */ (geometry);
        subgeos = geometry.getPolygons();
        return accumulate(subgeos, this.olPolygonGeometryToCesium.bind(this));
      default:
        console.assert(false, `Unhandled multi geometry type${geometry.getType()}`);
    }
  }

  /**
   * Convert an OpenLayers text style to Cesium.
   * @param {ol.layer.Vector|ol.layer.Image} layer
   * @param {!ol.Feature} feature OpenLayers feature..
   * @param {!ol.geom.Geometry} geometry
   * @param {!ol.style.Text} style
   * @return {Cesium.LabelCollection} Cesium primitive
   * @api
   */
  olGeometry4326TextPartToCesium(layer, feature, geometry, style) {
    const text = style.getText();
    if (!text) {
      return null;
    }

    const labels = new Cesium.LabelCollection({scene: this.scene});
    // TODO: export and use the text draw position from OpenLayers .
    // See src/ol/render/vector.js
    const extentCenter = getCenter(geometry.getExtent());
    if (geometry instanceof olGeomSimpleGeometry) {
      const first = geometry.getFirstCoordinate();
      extentCenter[2] = first.length == 3 ? first[2] : 0.0;
    }
    const options = /** @type {Cesium.optionsLabelCollection} */ ({});

    options.position = olcsCore.ol4326CoordinateToCesiumCartesian(extentCenter);

    options.text = text;

    options.heightReference = this.getHeightReference(layer, feature, geometry);

    const offsetX = style.getOffsetX();
    const offsetY = style.getOffsetY();
    if (offsetX != 0 && offsetY != 0) {
      const offset = new Cesium.Cartesian2(offsetX, offsetY);
      options.pixelOffset = offset;
    }

    options.font = style.getFont() || '10px sans-serif'; // OpenLayers default

    let labelStyle = undefined;
    if (style.getFill()) {
      options.fillColor = this.extractColorFromOlStyle(style, false);
      labelStyle = Cesium.LabelStyle.FILL;
    }
    if (style.getStroke()) {
      options.outlineWidth = this.extractLineWidthFromOlStyle(style);
      options.outlineColor = this.extractColorFromOlStyle(style, true);
      labelStyle = Cesium.LabelStyle.OUTLINE;
    }
    if (style.getFill() && style.getStroke()) {
      labelStyle = Cesium.LabelStyle.FILL_AND_OUTLINE;
    }
    options.style = labelStyle;

    let horizontalOrigin;
    switch (style.getTextAlign()) {
      case 'left':
        horizontalOrigin = Cesium.HorizontalOrigin.LEFT;
        break;
      case 'right':
        horizontalOrigin = Cesium.HorizontalOrigin.RIGHT;
        break;
      case 'center':
      default:
        horizontalOrigin = Cesium.HorizontalOrigin.CENTER;
    }
    options.horizontalOrigin = horizontalOrigin;

    if (style.getTextBaseline()) {
      let verticalOrigin;
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
          console.assert(false, `unhandled baseline ${style.getTextBaseline()}`);
      }
      options.verticalOrigin = verticalOrigin;
    }


    const l = labels.add(options);
    this.setReferenceForPicking(layer, feature, l);
    return labels;
  }

  /**
   * Convert an OpenLayers style to a Cesium Material.
   * @param {ol.Feature} feature OpenLayers feature..
   * @param {!ol.style.Style} style
   * @param {boolean} outline
   * @return {Cesium.Material}
   * @api
   */
  olStyleToCesium(feature, style, outline) {
    const fill = style.getFill();
    const stroke = style.getStroke();
    if ((outline && !stroke) || (!outline && !fill)) {
      return null; // FIXME use a default style? Developer error?
    }

    let color = outline ? stroke.getColor() : fill.getColor();
    color = olcsCore.convertColorToCesium(color);

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
        color
      });
    }

  }

  /**
   * Compute OpenLayers plain style.
   * Evaluates style function, blend arrays, get default style.
   * @param {ol.layer.Vector|ol.layer.Image} layer
   * @param {!ol.Feature} feature
   * @param {ol.StyleFunction|undefined} fallbackStyleFunction
   * @param {number} resolution
   * @return {Array.<!ol.style.Style>} null if no style is available
   * @api
   */
  computePlainStyle(layer, feature, fallbackStyleFunction, resolution) {
    /**
     * @type {ol.FeatureStyleFunction|undefined}
     */
    const featureStyleFunction = feature.getStyleFunction();

    /**
     * @type {ol.style.Style|Array.<ol.style.Style>}
     */
    let style = null;

    if (featureStyleFunction) {
      style = featureStyleFunction(feature, resolution);
    }

    if (!style && fallbackStyleFunction) {
      style = fallbackStyleFunction(feature, resolution);
    }

    if (!style) {
      // The feature must not be displayed
      return null;
    }

    // FIXME combine materials as in cesium-materials-pack?
    // then this function must return a custom material
    // More simply, could blend the colors like described in
    // http://en.wikipedia.org/wiki/Alpha_compositing
    return Array.isArray(style) ? style : [style];
  }

  /**
   * @protected
   * @param {!ol.Feature} feature
   * @param {!ol.style.Style} style
   * @param {!ol.geom.Geometry=} opt_geom Geometry to be converted.
   * @return {ol.geom.Geometry|undefined}
   */
  getGeometryFromFeature(feature, style, opt_geom) {
    if (opt_geom) {
      return opt_geom;
    }

    const geom3d = /** @type {!ol.geom.Geometry} */(feature.get('olcs.3d_geometry'));
    if (geom3d && geom3d instanceof olGeomGeometry) {
      return geom3d;
    }

    if (style) {
      const geomFuncRes = style.getGeometryFunction()(feature);
      if (geomFuncRes instanceof olGeomGeometry) {
        return geomFuncRes;
      }
    }

    return feature.getGeometry();
  }

  /**
   * Convert one OpenLayers feature up to a collection of Cesium primitives.
   * @param {ol.layer.Vector|ol.layer.Image} layer
   * @param {!ol.Feature} feature OpenLayers feature.
   * @param {!ol.style.Style} style
   * @param {!import('olcs/core/VectorLayerConterpart.js').OlFeatureToCesiumContext} context
   * @param {!ol.geom.Geometry=} opt_geom Geometry to be converted.
   * @return {Cesium.Primitive} primitives
   * @api
   */
  olFeatureToCesium(layer, feature, style, context, opt_geom) {
    let geom = this.getGeometryFromFeature(feature, style, opt_geom);

    if (!geom) {
      // OpenLayers features may not have a geometry
      // See http://geojson.org/geojson-spec.html#feature-objects
      return null;
    }

    const proj = context.projection;
    const newBillboardAddedCallback = function(bb) {
      const featureBb = context.featureToCesiumMap[getUid(feature)];
      if (featureBb instanceof Array) {
        featureBb.push(bb);
      }
      else {
        context.featureToCesiumMap[getUid(feature)] = [bb];
      }
    };

    switch (geom.getType()) {
      case 'GeometryCollection':
        const primitives = new Cesium.PrimitiveCollection();
        const collection = /** @type {!ol.geom.GeometryCollection} */ (geom);
        // TODO: use getGeometriesArray() instead
        collection.getGeometries().forEach((geom) => {
          if (geom) {
            const prims = this.olFeatureToCesium(layer, feature, style, context,
                geom);
            if (prims) {
              primitives.add(prims);
            }
          }
        });
        return primitives;
      case 'Point':
        geom = /** @type {!ol.geom.Point} */ (geom);
        const bbs = context.billboards;
        const result = this.olPointGeometryToCesium(layer, feature, geom, proj,
            style, bbs, newBillboardAddedCallback);
        if (!result) {
          // no wrapping primitive
          return null;
        } else {
          return result;
        }
      case 'Circle':
        geom = /** @type {!ol.geom.Circle} */ (geom);
        return this.olCircleGeometryToCesium(layer, feature, geom, proj,
            style);
      case 'LineString':
        geom = /** @type {!ol.geom.LineString} */ (geom);
        return this.olLineStringGeometryToCesium(layer, feature, geom, proj,
            style);
      case 'Polygon':
        geom = /** @type {!ol.geom.Polygon} */ (geom);
        return this.olPolygonGeometryToCesium(layer, feature, geom, proj,
            style);
      case 'MultiPoint':
      case 'MultiLineString':
      case 'MultiPolygon':
        const result2 = this.olMultiGeometryToCesium(layer, feature, geom, proj,
            style, context.billboards, newBillboardAddedCallback);
        if (!result2) {
          // no wrapping primitive
          return null;
        } else {
          return result2;
        }
      case 'LinearRing':
        throw new Error('LinearRing should only be part of polygon.');
      default:
        throw new Error(`Ol geom type not handled : ${geom.getType()}`);
    }
  }

  /**
   * Convert an OpenLayers vector layer to Cesium primitive collection.
   * For each feature, the associated primitive will be stored in
   * `featurePrimitiveMap`.
   * @param {!(ol.layer.Vector|ol.layer.Image)} olLayer
   * @param {!ol.View} olView
   * @param {!Object.<number, !Cesium.Primitive>} featurePrimitiveMap
   * @return {!olcs.core.VectorLayerCounterpart}
   * @api
   */
  olVectorLayerToCesium(olLayer, olView, featurePrimitiveMap) {
    const proj = olView.getProjection();
    const resolution = olView.getResolution();

    if (resolution === undefined || !proj) {
      console.assert(false, 'View not ready');
      // an assertion is not enough for closure to assume resolution and proj
      // are defined
      throw new Error('View not ready');
    }

    let source = olLayer.getSource();
    if (source instanceof olSourceCluster) {
      source = source.getSource();
    }

    console.assert(source instanceof olSourceVector);
    const features = source.getFeatures();
    const counterpart = new olcsCoreVectorLayerCounterpart(proj, this.scene);
    const context = counterpart.context;
    for (let i = 0; i < features.length; ++i) {
      const feature = features[i];
      if (!feature) {
        continue;
      }
      /**
       * @type {ol.StyleFunction|undefined}
       */
      const layerStyle = olLayer.getStyleFunction();
      const styles = this.computePlainStyle(olLayer, feature, layerStyle,
          resolution);
      if (!styles || !styles.length) {
        // only 'render' features with a style
        continue;
      }

      /**
       * @type {Cesium.Primitive|null}
       */
      let primitives = null;
      for (let i = 0; i < styles.length; i++) {
        const prims = this.olFeatureToCesium(olLayer, feature, styles[i], context);
        if (prims) {
          if (!primitives) {
            primitives = prims;
          } else if (prims) {
            let i = 0, prim;
            while ((prim = prims.get(i))) {
              primitives.add(prim);
              i++;
            }
          }
        }
      }
      if (!primitives) {
        continue;
      }
      featurePrimitiveMap[getUid(feature)] = primitives;
      counterpart.getRootPrimitive().add(primitives);
    }

    return counterpart;
  }

  /**
   * Convert an OpenLayers feature to Cesium primitive collection.
   * @param {!(ol.layer.Vector|ol.layer.Image)} layer
   * @param {!ol.View} view
   * @param {!ol.Feature} feature
   * @param {!import('olcs/core/VectorLayerConterpart.js').OlFeatureToCesiumContext} context
   * @return {Cesium.Primitive}
   * @api
   */
  convert(layer, view, feature, context) {
    const proj = view.getProjection();
    const resolution = view.getResolution();

    if (resolution == undefined || !proj) {
      return null;
    }

    /**
     * @type {ol.StyleFunction|undefined}
     */
    const layerStyle = layer.getStyleFunction();

    const styles = this.computePlainStyle(layer, feature, layerStyle, resolution);

    if (!styles || !styles.length) {
      // only 'render' features with a style
      return null;
    }

    context.projection = proj;

    /**
     * @type {Cesium.Primitive|null}
     */
    let primitives = null;
    for (let i = 0; i < styles.length; i++) {
      const prims = this.olFeatureToCesium(layer, feature, styles[i], context);
      if (!primitives) {
        primitives = prims;
      } else if (prims) {
        let i = 0, prim;
        while ((prim = prims.get(i))) {
          primitives.add(prim);
          i++;
        }
      }
    }
    return primitives;
  }
}


export default FeatureConverter;
