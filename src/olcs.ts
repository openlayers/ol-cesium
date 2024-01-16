import OLCesium from './olcs/OLCesium';
export default OLCesium;

export {default as AbstractSynchronizer} from './olcs/AbstractSynchronizer';
export {default as RasterSynchronizer} from './olcs/RasterSynchronizer';
export {default as VectorSynchronizer} from './olcs/VectorSynchronizer';

export {default as FeatureConverter} from './olcs/FeatureConverter';
export {default as OLCSCamera} from './olcs/Camera';

// Core api functions
export * from './olcs/core';
export {default as OLImageryProvider} from './olcs/core/OLImageryProvider';
export {default as VectorLayerCounterpart} from './olcs/core/VectorLayerCounterpart';

// Print functions
export * from './olcs/print';

// Contrib Manager
export {default as ContribManager} from './olcs/contrib/Manager';
export {default as ContribLazyLoader} from './olcs/contrib/LazyLoader';

// Deprecated export of olcs on window
// @ts-ignore
const olcs = window['olcs'] = {};
// @ts-ignore
olcs.OLCesium = OLCesium;

import {default as AbstractSynchronizer} from './olcs/AbstractSynchronizer';
import {default as RasterSynchronizer} from './olcs/RasterSynchronizer';
import {default as VectorSynchronizer} from './olcs/VectorSynchronizer';
// @ts-ignore
olcs.AbstractSynchronizer = AbstractSynchronizer;
// @ts-ignore
olcs.RasterSynchronizer = RasterSynchronizer;
// @ts-ignore
olcs.VectorSynchronizer = VectorSynchronizer;

import * as core from './olcs/core';
import {default as OLImageryProvider} from './olcs/core/OLImageryProvider';
import {default as VectorLayerCounterpart} from './olcs/core/VectorLayerCounterpart';
// @ts-ignore
olcs.core = core;
// @ts-ignore
olcs.core.OLImageryProvider = OLImageryProvider;
// @ts-ignore
olcs.core.VectorLayerCounterpart = VectorLayerCounterpart;

// @ts-ignore
olcs.contrib = {};
import {default as ContribManager} from './olcs/contrib/Manager';
import {default as ContribLazyLoader} from './olcs/contrib/LazyLoader';
// @ts-ignore
olcs.contrib.LazyLoader = ContribLazyLoader;
// @ts-ignore
olcs.contrib.Manager = ContribManager;
