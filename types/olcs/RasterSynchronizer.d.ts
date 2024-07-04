/**
 * @module olcs.RasterSynchronizer
 */
import Map from 'ol/Map.js';
import olcsAbstractSynchronizer from './AbstractSynchronizer';
import { type LayerWithParents } from './core';
import type { Scene, ImageryLayer } from 'cesium';
import type BaseLayer from 'ol/layer/Base.js';
import type Projection from 'ol/proj/Projection.js';
declare class RasterSynchronizer extends olcsAbstractSynchronizer<ImageryLayer> {
    private cesiumLayers_;
    private ourLayers_;
    /**
     * This object takes care of one-directional synchronization of
     * Openlayers raster layers to the given Cesium globe.
     */
    constructor(map: Map, scene: Scene);
    addCesiumObject(object: ImageryLayer): void;
    destroyCesiumObject(object: ImageryLayer): void;
    removeSingleCesiumObject(object: ImageryLayer, destroy: boolean): void;
    removeAllCesiumObjects(destroy: boolean): void;
    /**
     * Creates an array of Cesium.ImageryLayer.
     * May be overriden by child classes to implement custom behavior.
     * The default implementation handles tiled imageries in EPSG:4326 or
     * EPSG:3859.
     */
    protected convertLayerToCesiumImageries(olLayer: BaseLayer, viewProj: Projection): ImageryLayer[];
    createSingleLayerCounterparts(olLayerWithParents: LayerWithParents): ImageryLayer[];
    /**
     * Order counterparts using the same algorithm as the Openlayers renderer:
     * z-index then original sequence order.
     * @override
     * @protected
     */
    orderLayers(): void;
    raiseToTop(counterpart: ImageryLayer): void;
}
export default RasterSynchronizer;
