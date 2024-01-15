import OLCesium from 'olcs';
import olMap from 'ol/Map.js';
import olSourceOSM from 'ol/source/OSM.js';
import olLayerTile from 'ol/layer/Tile.js';
import {transform, get as getProjection} from 'ol/proj.js';
import olView from 'ol/View.js';
import {defaults as olControlDefaults} from 'ol/control.js';
import olOverlay from 'ol/Overlay.js';
import {toStringHDMS} from 'ol/coordinate.js';
import {OLCS_ION_TOKEN} from './_common.js';
/* global $ */

const source = new olSourceOSM();

Cesium.Ion.defaultAccessToken = OLCS_ION_TOKEN;
const ol2d = new olMap({
  layers: [
    new olLayerTile({
      source
    })
  ],
  controls: olControlDefaults({
    attributionOptions: {
      collapsible: false
    }
  }),
  target: 'map',
  view: new olView({
    center: transform([-112.2, 36.06], 'EPSG:4326', 'EPSG:3857'),
    zoom: 11
  })
});
const ol3d = new OLCesium({
  map: ol2d,
  target: 'map3d'
});
const scene = ol3d.getCesiumScene();
Cesium.createWorldTerrainAsync().then(tp => scene.terrainProvider = tp);

class OverlayHandler {
  constructor(ol2d, ol3d, scene) {
    this.ol2d = ol2d;
    this.ol3d = ol3d;
    this.scene = scene;

    this.staticOverlay = new olOverlay({
      element: document.getElementById('popup')
    });

    this.staticBootstrapPopup = new olOverlay({
      element: document.getElementById('popup-bootstrap')
    });
    this.ol2d.addOverlay(this.staticOverlay);
    this.ol2d.addOverlay(this.staticBootstrapPopup);

    this.options = {
      boostrap: false,
      add: true
    };

    this.ol2d.on('click', this.onClickHandlerOL.bind(this));
    const eventHandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
    eventHandler.setInputAction(this.onClickHandlerCS.bind(this), Cesium.ScreenSpaceEventType['LEFT_CLICK']);

    const clickForm = document.getElementById('click-action-form');
    clickForm.onchange = function(event) {
      const checked = $('input[name="click-action"]:checked').val();
      this.options.add = checked === 'add';
    }.bind(this);

    const typeForm = document.getElementById('overlay-type-form');
    typeForm.onchange = function(event) {
      const checked = $('input[name="overlay-type"]:checked').val();
      this.options.boostrap = checked === 'popover';
    }.bind(this);
  }

  onClickHandlerOL(event) {
    const coordinates = event.coordinate;
    const hdms = toStringHDMS(
        transform(coordinates, 'EPSG:3857', 'EPSG:4326')
    );
    const overlay = this.getOverlay();
    overlay.setPosition(coordinates);
    this.setOverlayContent(overlay, hdms);
  }

  onClickHandlerCS(event) {
    if (event.position.x === 0 && event.position.y === 0) {
      return;
    }

    const ray = this.scene.camera.getPickRay(event.position);
    const cartesian = this.scene.globe.pick(ray, scene);
    if (!cartesian) {
      return;
    }
    const cartographic = scene.globe.ellipsoid.cartesianToCartographic(cartesian);
    let coords = [Cesium.Math.toDegrees(cartographic.longitude), Cesium.Math.toDegrees(cartographic.latitude)];

    const height = scene.globe.getHeight(cartographic);
    if (height) {
      coords = coords.concat([height]);
    }

    const transformedCoords = transform(coords, getProjection('EPSG:4326'), 'EPSG:3857');
    const hdms = toStringHDMS(coords);
    const overlay = this.getOverlay();
    overlay.setPosition(transformedCoords);
    this.setOverlayContent(overlay, hdms);
  }

  getOverlay() {
    if (this.options.add) {
      return this.addOverlay();
    }

    if (this.options.boostrap) {
      return this.staticBootstrapPopup;
    }
    return this.staticOverlay;
  }

  setOverlayContent(overlay, hdms) {
    const element = overlay.getElement();
    if (this.options.boostrap) {
      const div = document.createElement('div');
      div.onclick = this.onCloseClick.bind(this, overlay, this.options.add);
      div.innerHTML = `<p>The location you clicked was:</p><code>${hdms}</code>`;
      $(element).popover('destroy');
      $(element).popover({
        'placement': 'top',
        'animation': false,
        'html': true,
        'content': div
      });
      $(element).popover('show');
    } else {
      element.childNodes.forEach((child) => {
        if (child.id === 'popup-content') {
          child.innerHTML = `<p>The location you clicked was:</p><code>${hdms}</code>`;
        } else if (child.id === 'popup-closer') {
          child.onclick = this.onCloseClick.bind(this, overlay, this.options.add);
        }
      });
    }
  }

  onCloseClick(overlay, add) {
    if (add) {
      this.ol2d.removeOverlay(overlay);
    } else {
      overlay.setPosition(undefined);
    }
  }

  addOverlay() {
    let element;
    if (this.options.boostrap) {
      element = document.getElementById('popup-bootstrap').cloneNode(true);
    } else {
      element = document.getElementById('popup').cloneNode(true);
    }
    const overlay = new olOverlay({element});
    this.ol2d.addOverlay(overlay);
    return overlay;
  }
}

new OverlayHandler(ol2d, ol3d, scene);

document.getElementById('enable').addEventListener('click', () => ol3d.setEnabled(!ol3d.getEnabled()));
