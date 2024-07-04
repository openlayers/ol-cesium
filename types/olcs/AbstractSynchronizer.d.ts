import LayerGroup from 'ol/layer/Group.js';
import Map from 'ol/Map.js';
import type { Scene, ImageryLayer } from 'cesium';
import View from 'ol/View.js';
import Collection from 'ol/Collection.js';
import BaseLayer from 'ol/layer/Base.js';
import type { EventsKey } from 'ol/events.js';
import type { LayerWithParents } from './core.js';
import VectorLayerCounterpart from './core/VectorLayerCounterpart';
declare abstract class AbstractSynchronizer<T extends ImageryLayer | VectorLayerCounterpart> {
    protected map: Map;
    protected view: View;
    protected scene: Scene;
    protected olLayers: Collection<BaseLayer>;
    mapLayerGroup: LayerGroup;
    /**
     * Map of OpenLayers layer ids (from getUid) to the Cesium ImageryLayers.
     * Null value means, that we are unable to create equivalent layers.
     */
    protected layerMap: Record<string, Array<T>>;
    /**
     * Map of listen keys for OpenLayers layer layers ids (from getUid).
     */
    protected olLayerListenKeys: Record<string, Array<EventsKey>>;
    /**
     * Map of listen keys for OpenLayers layer groups ids (from getUid).
     */
    private olGroupListenKeys_;
    protected constructor(map: Map, scene: Scene);
    /**
     * Destroy all and perform complete synchronization of the layers.
     */
    synchronize(): void;
    /**
     * Order counterparts using the same algorithm as the Openlayers renderer:
     * z-index then original sequence order.
     */
    protected orderLayers(): void;
    /**
     * Add a layer hierarchy.
     */
    private addLayers_;
    /**
     * Add Cesium objects.
     */
    private addCesiumObjects_;
    /**
     * Remove and destroy a single layer.
     * @param {ol.layer.Layer} layer
     * @return {boolean} counterpart destroyed
     */
    private removeAndDestroySingleLayer_;
    /**
     * Unlisten a single layer group.
     */
    private unlistenSingleGroup_;
    /**
     * Remove layer hierarchy.
     */
    private removeLayer_;
    /**
     * Register listeners for single layer group change.
     */
    private listenForGroupChanges_;
    /**
     * Destroys all the created Cesium objects.
     */
    destroyAll(): void;
    /**
     * Adds a single Cesium object to the collection.
     */
    protected abstract addCesiumObject(object: T): void;
    protected abstract destroyCesiumObject(object: T): void;
    /**
     * Remove single Cesium object from the collection.
     */
    protected abstract removeSingleCesiumObject(object: T, destroy: boolean): void;
    protected abstract removeAllCesiumObjects(destroy: boolean): void;
    protected abstract createSingleLayerCounterparts(olLayerWithParents: LayerWithParents): Array<T>;
}
export default AbstractSynchronizer;
