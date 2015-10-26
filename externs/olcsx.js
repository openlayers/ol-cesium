// Ol3-Cesium typedef externs, sorted alphabetically

/**
 * @type {Object}
 */
var olcsx;


/**
 * @typedef {{
 *   map: (!ol.Map),
 *   target: (Element|string|undefined),
 *   createSynchronizers: (undefined|function(!ol.Map, !Cesium.Scene): Array.<olcs.AbstractSynchronizer>)
 * }}
 * @api
 */
olcsx.OLCesiumOptions;


/**
 * The OpenLayers map we want to show on a Cesium scene.
 * @type {!ol.Map}
 * @api
 */
olcsx.OLCesiumOptions.prototype.map;


/**
 * Target element for the Cesium scene.
 * @type {Element|string|undefined}
 * @api
 */
olcsx.OLCesiumOptions.prototype.target;


/**
 * Callback function which will be called by the {@link olcs.OLCesium}
 * constructor to create custom synchronizers. Receives an `ol.Map` and a
 * `Cesium.Scene` as arguments, and needs to return an array of
 * {@link olcs.AbstractSynchronizer}.
 * @type {undefined|function(!ol.Map, !Cesium.Scene): Array.<olcs.AbstractSynchronizer>}
 * @api
 */
olcsx.OLCesiumOptions.prototype.createSynchronizers;


/**
 * Core namespace.
 * @type {Object}
 */
olcsx.core;


/**
 * Context for feature conversion.
 * @typedef {{
 *  projection: (!(ol.proj.Projection|string)),
 *  primitives: (!Cesium.PrimitiveCollection),
 *  featureToCesiumMap: (Object.<
 *    number,
 *    !Cesium.Primitive|!Cesium.Billboard>),
 *  billboards: (!Cesium.BillboardCollection)
 * }}
 * @api
 */
olcsx.core.OlFeatureToCesiumContext;


/**
 * Options for rotate around axis core function.
 * @typedef {{
 *   duration: (number|undefined),
 *   easing: (function(number):number|undefined),
 *   callback: (function()|undefined)
 * }}
 * @api
 */
olcsx.core.RotateAroundAxisOption;
