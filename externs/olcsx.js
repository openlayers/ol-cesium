/**
 * @externs
 */

/**
 * @const
 */
const olcsx = {};


/**
 * @typedef {{
 *   map: (!ol.Map),
 *   target: (Element|string|undefined),
 *   createSynchronizers: (undefined|function(!ol.Map, !Cesium.Scene, !Cesium.DataSourceCollection): Array.<olcs.AbstractSynchronizer>),
 *   time: (undefined|function(): Cesium.JulianDate),
 *   stopOpenLayersEventsPropagation: (boolean|undefined),
 *   sceneOptions: (Cesium.SceneOptions|undefined)
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
 * Control the current time used by Cesium.
 * @type {undefined|function(): Cesium.JulianDate}
 * @api
 */
olcsx.OLCesiumOptions.prototype.time;

/**
 * Allows the passing of property value to the `Cesium.Scene`.
 * @type {Cesium.SceneOptions|undefined}
 * @api
 */
olcsx.OLCesiumOptions.prototype.sceneOptions;

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
 * @type {undefined|function(!ol.Map, !Cesium.Scene, !Cesium.DataSourceCollection): Array.<olcs.AbstractSynchronizer>}
 * @api
 */
olcsx.OLCesiumOptions.prototype.createSynchronizers;

/**
 * Prevent propagation of mouse/touch events to OpenLayers when Cesium is active.
 * @type {boolean|undefined}
 */
olcsx.OLCesiumOptions.prototype.stopOpenLayersEventsPropagation;


/**
 * Core namespace.
 * @const
 */
olcsx.core = {};


/**
 * Context for feature conversion.
 * @typedef {{
 *  projection: (!(ol.proj.Projection|string)),
 *  primitives: (!Cesium.PrimitiveCollection),
 *  featureToCesiumMap: (Object.<
 *    number,
 *    Array<!Cesium.Primitive|!Cesium.Billboard>>),
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


/**
 * @typedef {{
 *   url: string,
 *   subdomains: string
 * }}
 * @api
 */
olcsx.core.CesiumUrlDefinition;


/**
 * @typedef {{
 *  layer: !ol.layer.Base,
 *  parents: Array<ol.layer.Group>
 * }}
 */
olcsx.LayerWithParents;


/**
 * Options for SynchronizedOverlay
 * @typedef {{
 *  scene: !Cesium.Scene,
 *  parent: !ol.Overlay,
 *  synchronizer: !olcs.OverlaySynchronizer
 * }}
 * @api
 */
olcsx.SynchronizedOverlayOptions;


/**
 * @const
 */
olcsx.contrib = {};

/**
 * @typedef {{
 *   map: ol.Map,
 *   cameraExtentInRadians: (ol.Extent|undefined)
 * }}
 * @api
 */
olcsx.contrib.ManagerOptions;


/**
 * @typedef {{
 *  debugModelMatrix: (Cesium.Matrix4|undefined),
 *  cesiumOptions: Cesium.ModelFromGltfOptions
 * }}
 */
olcsx.ModelStyle;
