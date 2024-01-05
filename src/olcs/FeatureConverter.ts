import OLStyleIcon from 'ol/style/Icon.js';
import VectorSource, {type VectorSourceEvent} from 'ol/source/Vector.js';
import OLClusterSource from 'ol/source/Cluster.js';
import {circular as olCreateCircularPolygon} from 'ol/geom/Polygon.js';
import {boundingExtent, getCenter} from 'ol/extent.js';
import olGeomSimpleGeometry from 'ol/geom/SimpleGeometry.js';
import {convertColorToCesium, olGeometryCloneTo4326, ol4326CoordinateToCesiumCartesian, ol4326CoordinateArrayToCsCartesians} from './core';
import VectorLayerCounterpart, {type OlFeatureToCesiumContext} from './core/VectorLayerCounterpart';
import {getUid, waitReady} from './util';
import type {CircleGeometry, CircleOutlineGeometry, Primitive, Billboard, Label, Matrix4, Scene, Geometry as CSGeometry, Color as CSColor, GroundPrimitive, PrimitiveCollection, ImageMaterialProperty, BillboardCollection, Cartesian3, GroundPolylinePrimitive, PolygonHierarchy, HeightReference, Model, LabelCollection, Material} from 'cesium';
import type VectorLayer from 'ol/layer/Vector.js';
import type ImageLayer from 'ol/layer/Image.js';
import type {Feature, View} from 'ol';
import type Text from 'ol/style/Text.js';
import {type default as Style, type StyleFunction} from 'ol/style/Style.js';
import type {ColorLike as OLColorLike} from 'ol/colorlike.js';
import type {Color as OLColor} from 'ol/color.js';
import type {ProjectionLike} from 'ol/proj.js';
import {Geometry as OLGeometry, type MultiLineString, type MultiPolygon, type MultiPoint, type GeometryCollection, type Circle, type LineString, type Point, type Polygon} from 'ol/geom.js';
import type ImageStyle from 'ol/style/Image.js';


type ModelFromGltfOptions = Parameters<typeof Model.fromGltfAsync>[0];

type PrimitiveLayer = VectorLayer<any> | ImageLayer<any>;

declare module 'cesium' {
  // eslint-disable-next-line no-unused-vars
  interface Primitive {
    olLayer: PrimitiveLayer;
    olFeature: Feature;
  }
  // eslint-disable-next-line no-unused-vars
  interface GroundPolylinePrimitive {
    olLayer: PrimitiveLayer;
    olFeature: Feature;
    _primitive: Primitive; // Missing from types published by Cesium
  }
  // eslint-disable-next-line no-unused-vars
  interface GroundPrimitive {
    olLayer: PrimitiveLayer;
    olFeature: Feature;
  }
  // eslint-disable-next-line no-unused-vars
  interface Label {
    olLayer: PrimitiveLayer;
    olFeature: Feature;
  }
  // eslint-disable-next-line no-unused-vars
  interface Billboard {
    olLayer: PrimitiveLayer;
    olFeature: Feature;
  }
}

interface ModelStyle {
  debugModelMatrix?: Matrix4;
  cesiumOptions: ModelFromGltfOptions;
}

interface MaterialAppearanceOptions {
  flat: boolean;
  renderState: {
    depthTest: {
      enabled: boolean;
    },
    lineWidth?: number;
  }
}

export default class FeatureConverter {

  /**
   * Bind once to have a unique function for using as a listener
   */
  private boundOnRemoveOrClearFeatureListener_ = this.onRemoveOrClearFeature_.bind(this);

  private defaultBillboardEyeOffset_ = new Cesium.Cartesian3(0, 0, 10);

  /**
   * Concrete base class for converting from OpenLayers3 vectors to Cesium
   * primitives.
   * Extending this class is possible provided that the extending class and
   * the library are compiled together by the closure compiler.
   * @param scene Cesium scene.
   * @api
   */
  constructor(protected scene: Scene) {
    this.scene = scene;
  }

  /**
   * @param evt
   */
  private onRemoveOrClearFeature_(evt: VectorSourceEvent) {
    const source = evt.target;
    console.assert(source instanceof VectorSource);

    const cancellers = source['olcs_cancellers'];
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
        source['olcs_cancellers'] = {};
      }
    }
  }

  /**
   * @param layer
   * @param feature OpenLayers feature.
   * @param primitive
   */
  protected setReferenceForPicking(layer: PrimitiveLayer, feature: Feature, primitive: GroundPolylinePrimitive | GroundPrimitive | Primitive| Label|Billboard) {
    primitive.olLayer = layer;
    primitive.olFeature = feature;
  }

  /**
   * Basics primitive creation using a color attribute.
   * Note that Cesium has 'interior' and outline geometries.
   * @param layer
   * @param feature OpenLayers feature.
   * @param olGeometry OpenLayers geometry.
   * @param geometry
   * @param color
   * @param opt_lineWidth
   * @return primitive
   */
  protected createColoredPrimitive(layer: PrimitiveLayer, feature: Feature, olGeometry: OLGeometry, geometry: CSGeometry | CircleGeometry, color: CSColor| ImageMaterialProperty, opt_lineWidth?: number): Primitive | GroundPrimitive {
    const createInstance = function(geometry: CSGeometry | CircleGeometry, color: CSColor | ImageMaterialProperty) {
      const instance = new Cesium.GeometryInstance({
        geometry
      });
      if (color && !(color instanceof Cesium.ImageMaterialProperty)) {
        instance.attributes = {
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(color)
        };
      }
      return instance;
    };

    const options: MaterialAppearanceOptions = {
      flat: true, // work with all geometries
      renderState: {
        depthTest: {
          enabled: true
        }
      }
    };

    if (opt_lineWidth !== undefined) {
      options.renderState.lineWidth = opt_lineWidth;
    }

    const instances = createInstance(geometry, color);

    const heightReference = this.getHeightReference(layer, feature, olGeometry);

    let primitive: GroundPrimitive | Primitive;

    if (heightReference === Cesium.HeightReference.CLAMP_TO_GROUND) {
      if (!('createShadowVolume' in instances.geometry.constructor)) {
        // This is not a ground geometry
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
      // FIXME: we created stylings which are not time related
      // What should we pass here?
      // @ts-ignore
      const dataUri = color.image.getValue().toDataURL();

      primitive.appearance = new Cesium.MaterialAppearance({
        flat: true,
        renderState: {
          depthTest: {
            enabled: true,
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
      primitive.appearance = new Cesium.MaterialAppearance({
        ...options,
        material: new Cesium.Material({
          translucent: color.alpha !== 1,
          fabric: {
            type: 'Color',
            uniforms: {
              color,
            }
          }
        })
      });
      if (primitive instanceof Cesium.Primitive && (feature.get('olcs_shadows') || layer.get('olcs_shadows'))) {
        primitive.shadows = 1;
      }
    }
    this.setReferenceForPicking(layer, feature, primitive);
    return primitive;
  }

  /**
   * Return the fill or stroke color from a plain ol style.
   * @param style
   * @param outline
   * @return {!CSColor}
   */
  protected extractColorFromOlStyle(style: Style | Text, outline: boolean) {
    const fillColor = style.getFill() ? style.getFill().getColor() : null;
    const strokeColor = style.getStroke() ? style.getStroke().getColor() : null;

    let olColor: OLColorLike | OLColor = 'black';
    if (strokeColor && outline) {
      olColor = strokeColor;
    } else if (fillColor) {
      olColor = fillColor;
    }

    return convertColorToCesium(olColor);
  }

  /**
   * Return the width of stroke from a plain ol style.
   * @param style
   * @return {number}
   */
  protected extractLineWidthFromOlStyle(style: Style | Text) {
    // Handling of line width WebGL limitations is handled by Cesium.
    const width = style.getStroke() ? style.getStroke().getWidth() : undefined;
    return width !== undefined ? width : 1;
  }

  /**
   * Create a primitive collection out of two Cesium geometries.
   * Only the OpenLayers style colors will be used.
   */
  protected wrapFillAndOutlineGeometries(layer: PrimitiveLayer, feature: Feature, olGeometry: OLGeometry, fillGeometry: CSGeometry | CircleGeometry, outlineGeometry: CSGeometry | CircleOutlineGeometry, olStyle: Style): PrimitiveCollection {
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

  // FIXME: would make more sense to only accept primitive collection.
  /**
   * Create a Cesium primitive if style has a text component.
   * Eventually return a PrimitiveCollection including current primitive.
   */
  protected addTextStyle(layer: PrimitiveLayer, feature: Feature, geometry: OLGeometry, style: Style, primitive: Primitive | PrimitiveCollection | GroundPolylinePrimitive): PrimitiveCollection {
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
   * @param billboards
   * @param bbOptions
   * @param layer
   * @param feature OpenLayers feature.
   * @param geometry
   * @param style
   * @return newly created billboard
   * @api
   */
  csAddBillboard(billboards: BillboardCollection, bbOptions: Parameters<BillboardCollection['add']>[0], layer: PrimitiveLayer, feature: Feature, geometry: OLGeometry, style: Style): Billboard {
    if (!bbOptions.eyeOffset) {
      bbOptions.eyeOffset = this.defaultBillboardEyeOffset_;
    }
    const bb = billboards.add(bbOptions);
    this.setReferenceForPicking(layer, feature, bb);
    return bb;
  }

  /**
   * Convert an OpenLayers circle geometry to Cesium.
   * @api
   */
  olCircleGeometryToCesium(layer: PrimitiveLayer, feature: Feature, olGeometry: Circle, projection: ProjectionLike, olStyle: Style): PrimitiveCollection {

    olGeometry = olGeometryCloneTo4326(olGeometry, projection);
    console.assert(olGeometry.getType() == 'Circle');

    // ol.Coordinate
    const olCenter = olGeometry.getCenter();
    const height = olCenter.length == 3 ? olCenter[2] : 0.0;
    const olPoint = olCenter.slice();
    olPoint[0] += olGeometry.getRadius();

    // Cesium
    const center: Cartesian3 = ol4326CoordinateToCesiumCartesian(olCenter);
    const point: Cartesian3 = ol4326CoordinateToCesiumCartesian(olPoint);

    // Accurate computation of straight distance
    const radius = Cesium.Cartesian3.distance(center, point);

    const fillGeometry = new Cesium.CircleGeometry({
      center,
      radius,
      height
    });

    let outlinePrimitive: Primitive | GroundPrimitive | GroundPolylinePrimitive;
    let outlineGeometry;
    if (this.getHeightReference(layer, feature, olGeometry) === Cesium.HeightReference.CLAMP_TO_GROUND) {
      const width = this.extractLineWidthFromOlStyle(olStyle);
      if (width) {
        const circlePolygon = olCreateCircularPolygon(olGeometry.getCenter(), radius);
        const positions = ol4326CoordinateArrayToCsCartesians(circlePolygon.getLinearRing(0).getCoordinates());
        const op = outlinePrimitive = new Cesium.GroundPolylinePrimitive({
          geometryInstances: new Cesium.GeometryInstance({
            geometry: new Cesium.GroundPolylineGeometry({positions, width}),
          }),
          appearance: new Cesium.PolylineMaterialAppearance({
            material: this.olStyleToCesium(feature, olStyle, true),
          }),
          classificationType: Cesium.ClassificationType.TERRAIN,
        });
        waitReady(outlinePrimitive).then(() => {
          this.setReferenceForPicking(layer, feature, op._primitive);
        });
      }
    } else {
      outlineGeometry = new Cesium.CircleOutlineGeometry({
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
   * Convert an OpenLayers line string geometry to Cesium.
   * @api
   */
  olLineStringGeometryToCesium(layer: PrimitiveLayer, feature: Feature, olGeometry: LineString, projection: ProjectionLike, olStyle: Style): PrimitiveCollection {

    olGeometry = olGeometryCloneTo4326(olGeometry, projection);
    console.assert(olGeometry.getType() == 'LineString');

    const positions = ol4326CoordinateArrayToCsCartesians(olGeometry.getCoordinates());
    const width = this.extractLineWidthFromOlStyle(olStyle);

    let outlinePrimitive: Primitive | GroundPolylinePrimitive;
    const heightReference = this.getHeightReference(layer, feature, olGeometry);

    const appearance = new Cesium.PolylineMaterialAppearance({
      material: this.olStyleToCesium(feature, olStyle, true)
    });
    if (heightReference === Cesium.HeightReference.CLAMP_TO_GROUND) {
      const geometry = new Cesium.GroundPolylineGeometry({
        positions,
        width,
      });
      const op = outlinePrimitive = new Cesium.GroundPolylinePrimitive({
        appearance,
        geometryInstances: new Cesium.GeometryInstance({
          geometry
        })
      });
      waitReady(outlinePrimitive).then(() => {
        this.setReferenceForPicking(layer, feature, op._primitive);
      });
    } else {
      const geometry = new Cesium.PolylineGeometry({
        positions,
        width,
        vertexFormat: appearance.vertexFormat
      });
      outlinePrimitive = new Cesium.Primitive({
        appearance,
        geometryInstances: new Cesium.GeometryInstance({
          geometry
        }),
      });
    }

    this.setReferenceForPicking(layer, feature, outlinePrimitive);

    return this.addTextStyle(layer, feature, olGeometry, olStyle, outlinePrimitive);
  }

  /**
   * Convert an OpenLayers polygon geometry to Cesium.
   * @api
   */
  olPolygonGeometryToCesium(layer: PrimitiveLayer, feature: Feature, olGeometry: Polygon, projection: ProjectionLike, olStyle: Style): PrimitiveCollection {

    olGeometry = olGeometryCloneTo4326(olGeometry, projection);
    console.assert(olGeometry.getType() == 'Polygon');

    const heightReference = this.getHeightReference(layer, feature, olGeometry);

    let fillGeometry, outlineGeometry;
    let outlinePrimitive: GroundPolylinePrimitive;
    if ((olGeometry.getCoordinates()[0].length == 5) &&
        (feature.get('olcs.polygon_kind') === 'rectangle')) {
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

      const featureExtrudedHeight = feature.get('olcs_extruded_height');

      // Render the cartographic rectangle
      fillGeometry = new Cesium.RectangleGeometry({
        ellipsoid: Cesium.Ellipsoid.WGS84,
        rectangle,
        height: maxHeight,
        extrudedHeight: featureExtrudedHeight,
      });

      outlineGeometry = new Cesium.RectangleOutlineGeometry({
        ellipsoid: Cesium.Ellipsoid.WGS84,
        rectangle,
        height: maxHeight,
        extrudedHeight: featureExtrudedHeight,
      });
    } else {
      const rings = olGeometry.getLinearRings();
      const hierarchy: PolygonHierarchy = {
        positions: [],
        holes: [],
      };
      const polygonHierarchy: PolygonHierarchy = hierarchy;
      console.assert(rings.length > 0);

      for (let i = 0; i < rings.length; ++i) {
        const olPos = rings[i].getCoordinates();
        const positions = ol4326CoordinateArrayToCsCartesians(olPos);
        console.assert(positions && positions.length > 0);
        if (i === 0) {
          hierarchy.positions = positions;
        } else {
          hierarchy.holes.push({
            positions,
            holes: [],
          });
        }
      }

      const featureExtrudedHeight = feature.get('olcs_extruded_height');

      fillGeometry = new Cesium.PolygonGeometry({
        polygonHierarchy,
        perPositionHeight: true,
        extrudedHeight: featureExtrudedHeight,
      });

      // Since Cesium doesn't yet support Polygon outlines on terrain yet (coming soon...?)
      // we don't create an outline geometry if clamped, but instead do the polyline method
      // for each ring. Most of this code should be removeable when Cesium adds
      // support for Polygon outlines on terrain.
      if (heightReference === Cesium.HeightReference.CLAMP_TO_GROUND) {
        const width = this.extractLineWidthFromOlStyle(olStyle);
        if (width > 0) {
          const positions: Cartesian3[][] = [hierarchy.positions];
          if (hierarchy.holes) {
            for (let i = 0; i < hierarchy.holes.length; ++i) {
              positions.push(hierarchy.holes[i].positions);
            }
          }
          const appearance = new Cesium.PolylineMaterialAppearance({
            material: this.olStyleToCesium(feature, olStyle, true)
          });
          const geometryInstances = [];
          for (const linePositions of positions) {
            const polylineGeometry = new Cesium.GroundPolylineGeometry({positions: linePositions, width});
            geometryInstances.push(new Cesium.GeometryInstance({
              geometry: polylineGeometry
            }));
          }
          outlinePrimitive = new Cesium.GroundPolylinePrimitive({
            appearance,
            geometryInstances
          });
          waitReady(outlinePrimitive).then(() => {
            this.setReferenceForPicking(layer, feature, outlinePrimitive._primitive);
          });
        }
      } else {
        // Actually do the normal polygon thing. This should end the removable
        // section of code described above.
        outlineGeometry = new Cesium.PolygonOutlineGeometry({
          polygonHierarchy: hierarchy,
          perPositionHeight: true,
          extrudedHeight: featureExtrudedHeight,
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
   * @api
   */
  getHeightReference(layer: PrimitiveLayer, feature: Feature, geometry: OLGeometry): HeightReference {

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
      layer: PrimitiveLayer,
      feature: Feature,
      olGeometry: Point,
      projection: ProjectionLike,
      style: Style,
      imageStyle: ImageStyle,
      billboards: BillboardCollection,
      opt_newBillboardCallback: (bb: Billboard) => void,
  ) {
    if (imageStyle instanceof OLStyleIcon) {
      // make sure the image is scheduled for load
      imageStyle.load();
    }

    const image = imageStyle.getImage(1); // get normal density
    const isImageLoaded = function(image: HTMLImageElement) {
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
      const position = ol4326CoordinateToCesiumCartesian(center);
      let color;
      const opacity = imageStyle.getOpacity();
      if (opacity !== undefined) {
        color = new Cesium.Color(1.0, 1.0, 1.0, opacity);
      }

      const scale = imageStyle.getScale();
      const heightReference = this.getHeightReference(layer, feature, olGeometry);

      const bbOptions: Parameters<BillboardCollection['add']>[0] = {
        image,
        color,
        scale,
        heightReference,
        position
      };

      // merge in cesium options from openlayers feature
      Object.assign(bbOptions, feature.get('cesiumOptions'));

      if (imageStyle instanceof OLStyleIcon) {
        const anchor = imageStyle.getAnchor();
        if (anchor) {
          const xScale = (Array.isArray(scale) ? scale[0] : scale);
          const yScale = (Array.isArray(scale) ? scale[1] : scale);
          bbOptions.pixelOffset = new Cesium.Cartesian2(
              (image.width / 2 - anchor[0]) * xScale,
              (image.height / 2 - anchor[1]) * yScale
          );
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
      let cancellers = source['olcs_cancellers'];
      if (!cancellers) {
        cancellers = source['olcs_cancellers'] = {};
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
   * @param layer
   * @param feature OpenLayers feature..
   * @param olGeometry OpenLayers point geometry.
   * @param projection
   * @param style
   * @param billboards
   * @param opt_newBillboardCallback Called when the new billboard is added.
   * @return primitives
   * @api
   */
  olPointGeometryToCesium(
      layer: PrimitiveLayer,
      feature: Feature,
      olGeometry: Point,
      projection: ProjectionLike,
      style: Style,
      billboards: BillboardCollection,
      opt_newBillboardCallback?: (bb: Billboard) => void
  ): PrimitiveCollection {
    console.assert(olGeometry.getType() == 'Point');
    olGeometry = olGeometryCloneTo4326(olGeometry, projection);

    let modelPrimitive: PrimitiveCollection = null;
    const imageStyle = style.getImage();
    if (imageStyle) {
      const olcsModelFunction: () => ModelStyle = olGeometry.get('olcs_model') || feature.get('olcs_model');
      if (olcsModelFunction) {
        modelPrimitive = new Cesium.PrimitiveCollection();
        const olcsModel = olcsModelFunction();
        const options: ModelFromGltfOptions = Object.assign({}, {scene: this.scene}, olcsModel.cesiumOptions);
        if ('fromGltf' in Cesium.Model) {
          // pre Cesium v107
          // @ts-ignore
          const model = Cesium.Model.fromGltf(options);
          modelPrimitive.add(model);
        } else {
          Cesium.Model.fromGltfAsync(options).then((model) => {
            modelPrimitive.add(model);
          });
        }

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
      layer: PrimitiveLayer,
      feature: Feature,
      geometry: OLGeometry,
      projection: ProjectionLike,
      olStyle: Style,
      billboards: BillboardCollection,
      opt_newBillboardCallback: (bb: Billboard) => void
  ) {
    // Do not reproject to 4326 now because it will be done later.

    switch (geometry.getType()) {
      case 'MultiPoint': {
        const points = (geometry as MultiPoint).getPoints();
        if (olStyle.getText()) {
          const primitives = new Cesium.PrimitiveCollection();
          points.forEach((geom) => {
            console.assert(geom);
            const result = this.olPointGeometryToCesium(layer, feature, geom,
                projection, olStyle, billboards, opt_newBillboardCallback);
            if (result) {
              primitives.add(result);
            }
          });
          return primitives;
        } else {
          points.forEach((geom) => {
            console.assert(geom);
            this.olPointGeometryToCesium(layer, feature, geom, projection,
                olStyle, billboards, opt_newBillboardCallback);
          });
          return null;
        }
      }
      case 'MultiLineString': {
        const lineStrings = (geometry as MultiLineString).getLineStrings();
        // FIXME: would be better to combine all child geometries in one primitive
        // instead we create n primitives for simplicity.
        const primitives = new Cesium.PrimitiveCollection();
        lineStrings.forEach((geom) => {
          const p = this.olLineStringGeometryToCesium(layer, feature, geom, projection, olStyle);
          primitives.add(p);
        });
        return primitives;
      }
      case 'MultiPolygon': {
        const polygons = (geometry as MultiPolygon).getPolygons();
        // FIXME: would be better to combine all child geometries in one primitive
        // instead we create n primitives for simplicity.
        const primitives = new Cesium.PrimitiveCollection();
        polygons.forEach((geom) => {
          const p = this.olPolygonGeometryToCesium(layer, feature, geom, projection, olStyle);
          primitives.add(p);
        });
        return primitives;
      }
      default:
        console.assert(false, `Unhandled multi geometry type${geometry.getType()}`);
    }
  }

  /**
   * Convert an OpenLayers text style to Cesium.
   * @api
   */
  olGeometry4326TextPartToCesium(layer: PrimitiveLayer, feature: Feature, geometry: OLGeometry, style: Text): LabelCollection {
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
    const options: Parameters<LabelCollection['add']>[0] = {};

    options.position = ol4326CoordinateToCesiumCartesian(extentCenter);

    options.text = text;

    options.heightReference = this.getHeightReference(layer, feature, geometry);

    const offsetX = style.getOffsetX();
    const offsetY = style.getOffsetY();
    if (offsetX != 0 || offsetY != 0) {
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
   * @api
   */
  olStyleToCesium(feature: Feature, style: Style, outline: boolean): Material {
    const fill = style.getFill();
    const stroke = style.getStroke();
    if ((outline && !stroke) || (!outline && !fill)) {
      return null; // FIXME use a default style? Developer error?
    }

    const olColor = outline ? stroke.getColor() : fill.getColor();
    const color = convertColorToCesium(olColor);

    if (outline && stroke.getLineDash()) {
      return Cesium.Material.fromType('Stripe', {
        horizontal: false,
        repeat: 500, // TODO how to calculate this?
        evenColor: color,
        oddColor: new Cesium.Color(0, 0, 0, 0) // transparent
      });
    } else {
      return Cesium.Material.fromType('Color', {
        color
      });
    }

  }

  /**
   * Compute OpenLayers plain style.
   * Evaluates style function, blend arrays, get default style.
   * @api
   */
  computePlainStyle(layer: PrimitiveLayer, feature: Feature, fallbackStyleFunction: StyleFunction, resolution: number): Style[] {
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
   */
  protected getGeometryFromFeature(feature: Feature, style: Style, opt_geom?: OLGeometry): OLGeometry | undefined {
    if (opt_geom) {
      return opt_geom;
    }

    const geom3d: OLGeometry = feature.get('olcs.3d_geometry');
    if (geom3d && geom3d instanceof OLGeometry) {
      return geom3d;
    }

    if (style) {
      const geomFuncRes = style.getGeometryFunction()(feature);
      if (geomFuncRes instanceof OLGeometry) {
        return geomFuncRes;
      }
    }

    return feature.getGeometry();
  }

  /**
   * Convert one OpenLayers feature up to a collection of Cesium primitives.
   * @api
   */
  olFeatureToCesium(layer: PrimitiveLayer, feature: Feature, style: Style, context: OlFeatureToCesiumContext, opt_geom?: OLGeometry): PrimitiveCollection {
    const geom: OLGeometry = this.getGeometryFromFeature(feature, style, opt_geom);

    if (!geom) {
      // OpenLayers features may not have a geometry
      // See http://geojson.org/geojson-spec.html#feature-objects
      return null;
    }

    const proj = context.projection;
    const newBillboardAddedCallback = function(bb: Billboard) {
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
        (geom as GeometryCollection).getGeometriesArray().forEach((geom) => {
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
        const bbs = context.billboards;
        const result = this.olPointGeometryToCesium(layer, feature, geom as Point, proj,
            style, bbs, newBillboardAddedCallback);
        if (!result) {
          // no wrapping primitive
          return null;
        } else {
          return result;
        }
      case 'Circle':
        return this.olCircleGeometryToCesium(layer, feature, geom as Circle, proj,
            style);
      case 'LineString':
        return this.olLineStringGeometryToCesium(layer, feature, geom as LineString, proj,
            style);
      case 'Polygon':
        return this.olPolygonGeometryToCesium(layer, feature, geom as Polygon, proj,
            style);
      case 'MultiPoint':
        return this.olMultiGeometryToCesium(layer, feature, geom as MultiPoint, proj,
            style, context.billboards, newBillboardAddedCallback) || null;
      case 'MultiLineString':
        return this.olMultiGeometryToCesium(layer, feature, geom as MultiLineString, proj,
            style, context.billboards, newBillboardAddedCallback) || null;
      case 'MultiPolygon':
        return this.olMultiGeometryToCesium(layer, feature, geom as MultiPolygon, proj,
            style, context.billboards, newBillboardAddedCallback) || null;
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
   * @api
   */
  olVectorLayerToCesium(olLayer: VectorLayer<VectorSource>, olView: View, featurePrimitiveMap: Record<number, PrimitiveCollection>): VectorLayerCounterpart {
    const proj = olView.getProjection();
    const resolution = olView.getResolution();

    if (resolution === undefined || !proj) {
      console.assert(false, 'View not ready');
      // an assertion is not enough for closure to assume resolution and proj
      // are defined
      throw new Error('View not ready');
    }

    let source = olLayer.getSource();
    if (source instanceof OLClusterSource) {
      source = source.getSource();
    }

    console.assert(source instanceof VectorSource);
    const features = source.getFeatures();
    const counterpart = new VectorLayerCounterpart(proj, this.scene);
    const context = counterpart.context;
    for (let i = 0; i < features.length; ++i) {
      const feature = features[i];
      if (!feature) {
        continue;
      }
      const layerStyle: StyleFunction | undefined = olLayer.getStyleFunction();
      const styles = this.computePlainStyle(olLayer, feature, layerStyle,
          resolution);
      if (!styles || !styles.length) {
        // only 'render' features with a style
        continue;
      }

      let primitives: PrimitiveCollection = null;
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
   * @api
   */
  convert(layer: VectorLayer<VectorSource>, view: View, feature: Feature, context: OlFeatureToCesiumContext): PrimitiveCollection {
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
