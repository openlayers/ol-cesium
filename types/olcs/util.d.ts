/**
 * @module olcs.util
 */
/**
 * Cast to object.
 * @param {Object} param
 * @return {Object}
 */
export function obj(param: Object): Object;
/**
 * @return {boolean}
 */
export function supportsImageRenderingPixelated(): boolean;
/**
 * @return {string}
 */
export function imageRenderingValue(): string;
/**
 * Return the projection of the source that Cesium should use.
 *
 * @param {ol.source.Source} source Source.
 * @returns {ol.proj.Projection} The projection of the source.
 */
export function getSourceProjection(source: ol.source.Source): ol.proj.Projection;
/**
 * @param {ol.Observable} observable
 * @param {string} type
 * @param {Function} listener
 * @return {!ol.events.EventsKey}
 */
export function olcsListen(observable: ol.Observable, type: string, listener: Function): ol.events.EventsKey;
/**
 * Gets a unique ID for an object. This mutates the object so that further calls
 * with the same object as a parameter returns the same value. Unique IDs are generated
 * as a strictly increasing sequence. Adapted from goog.getUid.
 *
 * @param {Object} obj The object to get the unique ID for.
 * @return {number} The unique ID for the object.
 */
export function getUid(obj: Object): number;
/**
 * Sort the passed array such that the relative order of equal elements is preverved.
 * See https://en.wikipedia.org/wiki/Sorting_algorithm#Stability for details.
 * @param {Array<*>} arr The array to sort (modifies original).
 * @param {!function(*, *): number} compareFnc Comparison function.
 */
export function stableSort(arr: Array<any>, compareFnc: (arg0: any, arg1: any) => number): void;
/**
 * @param {Node} node The node to remove.
 * @returns {Node} The node that was removed or null.
 */
export function removeNode(node: Node): Node;
/**
 * @param {Node} node The node to remove the children from.
 */
export function removeChildren(node: Node): void;
/**
 * @param {Cesium.Scene} scene The scene.
 */
export function isGroundPolylinePrimitiveSupported(scene: Cesium.Scene): boolean;
export function waitReady(object: any): any;
