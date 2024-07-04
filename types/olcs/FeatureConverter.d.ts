export default FeatureConverter;
export type ModelStyle = {
    debugModelMatrix?: Cesium.Matrix4;
    cesiumOptions: Cesium.ModelFromGltfOptions;
};
/**
 * @typedef {Object} ModelStyle
 * @property {Cesium.Matrix4} [debugModelMatrix]
 * @property {Cesium.ModelFromGltfOptions} cesiumOptions
 */
declare class FeatureConverter {
    /**
     * Concrete base class for converting from OpenLayers3 vectors to Cesium
     * primitives.
     * Extending this class is possible provided that the extending class and
     * the library are compiled together by the closure compiler.
     * @param {!Cesium.Scene} scene Cesium scene.
     * @constructor
     * @api
     */
    constructor(scene: Cesium.Scene);
    /**
     * @protected
     */
    protected scene: Cesium.Scene;
    /**
     * Bind once to have a unique function for using as a listener
     * @type {function(ol.source.Vector.Event)}
     * @private
     */
    private boundOnRemoveOrClearFeatureListener_;
    /**
     * @type {Cesium.Cartesian3}
     * @private
     */
    private defaultBillboardEyeOffset_;
    /**
     * @param {ol.source.Vector.Event} evt
     * @private
     */
    private onRemoveOrClearFeature_;
    /**
     * @param {ol.layer.Vector|ol.layer.Image} layer
     * @param {!ol.Feature} feature OpenLayers feature.
     * @param {!Cesium.Primitive|Cesium.Label|Cesium.Billboard} primitive
     * @protected
     */
    protected setReferenceForPicking(layer: ol.layer.Vector | ol.layer.Image, feature: ol.Feature, primitive: Cesium.Primitive | Cesium.Label | Cesium.Billboard): void;
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
    protected createColoredPrimitive(layer: ol.layer.Vector | ol.layer.Image, feature: ol.Feature, olGeometry: ol.geom.Geometry, geometry: Cesium.Geometry, color: Cesium.Color, opt_lineWidth?: number | undefined): Cesium.Primitive;
    /**
     * Return the fill or stroke color from a plain ol style.
     * @param {!ol.style.Style|ol.style.Text} style
     * @param {boolean} outline
     * @return {!Cesium.Color}
     * @protected
     */
    protected extractColorFromOlStyle(style: ol.style.Style | ol.style.Text, outline: boolean): Cesium.Color;
    /**
     * Return the width of stroke from a plain ol style.
     * @param {!ol.style.Style|ol.style.Text} style
     * @return {number}
     * @protected
     */
    protected extractLineWidthFromOlStyle(style: ol.style.Style | ol.style.Text): number;
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
    protected wrapFillAndOutlineGeometries(layer: ol.layer.Vector | ol.layer.Image, feature: ol.Feature, olGeometry: ol.geom.Geometry, fillGeometry: Cesium.Geometry, outlineGeometry: Cesium.Geometry, olStyle: ol.style.Style): Cesium.PrimitiveCollection;
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
    protected addTextStyle(layer: ol.layer.Vector | ol.layer.Image, feature: ol.Feature, geometry: ol.geom.Geometry, style: ol.style.Style, primitive: Cesium.Primitive): Cesium.PrimitiveCollection;
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
    csAddBillboard(billboards: Cesium.BillboardCollection, bbOptions: Cesium.optionsBillboardCollectionAdd, layer: ol.layer.Vector | ol.layer.Image, feature: ol.Feature, geometry: ol.geom.Geometry, style: ol.style.Style): Cesium.Billboard;
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
    olCircleGeometryToCesium(layer: ol.layer.Vector | ol.layer.Image, feature: ol.Feature, olGeometry: ol.geom.Circle, projection: ol.ProjectionLike, olStyle: ol.style.Style): Cesium.PrimitiveCollection;
    /**
     * @param {ol.layer.Vector|ol.layer.Image} layer
     * @param {!ol.Feature} feature OpenLayers feature..
     * @param {!number} width The width of the line.
     * @param {!Cesium.Color} color The color of the line.
     * @param {!Array<Cesium.Cartesian3>|Array<Array<Cesium.Cartesian3>>} positions The vertices of the line(s).
     * @return {!Cesium.GroundPrimitive} primitive
     */
    createStackedGroundCorridors(layer: ol.layer.Vector | ol.layer.Image, feature: ol.Feature, width: number, color: Cesium.Color, positions: Array<Cesium.Cartesian3> | Array<Array<Cesium.Cartesian3>>): Cesium.GroundPrimitive;
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
    olLineStringGeometryToCesium(layer: ol.layer.Vector | ol.layer.Image, feature: ol.Feature, olGeometry: ol.geom.LineString, projection: ol.ProjectionLike, olStyle: ol.style.Style): Cesium.PrimitiveCollection;
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
    olPolygonGeometryToCesium(layer: ol.layer.Vector | ol.layer.Image, feature: ol.Feature, olGeometry: ol.geom.Polygon, projection: ol.ProjectionLike, olStyle: ol.style.Style): Cesium.PrimitiveCollection;
    /**
     * @param {ol.layer.Vector|ol.layer.Image} layer
     * @param {ol.Feature} feature OpenLayers feature..
     * @param {!ol.geom.Geometry} geometry
     * @return {!Cesium.HeightReference}
     * @api
     */
    getHeightReference(layer: ol.layer.Vector | ol.layer.Image, feature: ol.Feature, geometry: ol.geom.Geometry): Cesium.HeightReference;
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
    createBillboardFromImage(layer: ol.layer.Vector | ol.layer.Image, feature: ol.Feature, olGeometry: ol.geom.Point, projection: ol.ProjectionLike, style: ol.style.Style, imageStyle: ol.style.Image, billboards: Cesium.BillboardCollection, opt_newBillboardCallback?: ((arg0: Cesium.Billboard) => any) | undefined): void;
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
    olPointGeometryToCesium(layer: ol.layer.Vector | ol.layer.Image, feature: ol.Feature, olGeometry: ol.geom.Point, projection: ol.ProjectionLike, style: ol.style.Style, billboards: Cesium.BillboardCollection, opt_newBillboardCallback?: ((arg0: Cesium.Billboard) => any) | undefined): Cesium.Primitive;
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
    olMultiGeometryToCesium(layer: ol.layer.Vector | ol.layer.Image, feature: ol.Feature, geometry: ol.geom.Geometry, projection: ol.ProjectionLike, olStyle: ol.style.Style, billboards: Cesium.BillboardCollection, opt_newBillboardCallback?: ((arg0: Cesium.Billboard) => any) | undefined): Cesium.Primitive;
    /**
     * Convert an OpenLayers text style to Cesium.
     * @param {ol.layer.Vector|ol.layer.Image} layer
     * @param {!ol.Feature} feature OpenLayers feature..
     * @param {!ol.geom.Geometry} geometry
     * @param {!ol.style.Text} style
     * @return {Cesium.LabelCollection} Cesium primitive
     * @api
     */
    olGeometry4326TextPartToCesium(layer: ol.layer.Vector | ol.layer.Image, feature: ol.Feature, geometry: ol.geom.Geometry, style: ol.style.Text): Cesium.LabelCollection;
    /**
     * Convert an OpenLayers style to a Cesium Material.
     * @param {ol.Feature} feature OpenLayers feature..
     * @param {!ol.style.Style} style
     * @param {boolean} outline
     * @return {Cesium.Material}
     * @api
     */
    olStyleToCesium(feature: ol.Feature, style: ol.style.Style, outline: boolean): Cesium.Material;
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
    computePlainStyle(layer: ol.layer.Vector | ol.layer.Image, feature: ol.Feature, fallbackStyleFunction: ol.StyleFunction | undefined, resolution: number): Array<ol.style.Style>;
    /**
     * @protected
     * @param {!ol.Feature} feature
     * @param {!ol.style.Style} style
     * @param {!ol.geom.Geometry=} opt_geom Geometry to be converted.
     * @return {ol.geom.Geometry|undefined}
     */
    protected getGeometryFromFeature(feature: ol.Feature, style: ol.style.Style, opt_geom?: ol.geom.Geometry): ol.geom.Geometry | undefined;
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
    olFeatureToCesium(layer: ol.layer.Vector | ol.layer.Image, feature: ol.Feature, style: ol.style.Style, context: any, opt_geom?: ol.geom.Geometry): Cesium.Primitive;
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
    olVectorLayerToCesium(olLayer: (ol.layer.Vector | ol.layer.Image), olView: ol.View, featurePrimitiveMap: {
        [x: number]: Cesium.Primitive;
    }): olcs.core.VectorLayerCounterpart;
    /**
     * Convert an OpenLayers feature to Cesium primitive collection.
     * @param {!(ol.layer.Vector|ol.layer.Image)} layer
     * @param {!ol.View} view
     * @param {!ol.Feature} feature
     * @param {!import('olcs/core/VectorLayerConterpart.js').OlFeatureToCesiumContext} context
     * @return {Cesium.Primitive}
     * @api
     */
    convert(layer: (ol.layer.Vector | ol.layer.Image), view: ol.View, feature: ol.Feature, context: any): Cesium.Primitive;
}
