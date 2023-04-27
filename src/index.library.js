import OLCesium from './olcs/OLCesium.ts';

import AbstractSynchronizer from './olcs/AbstractSynchronizer.ts';
import RasterSynchronizer from './olcs/RasterSynchronizer.js';
import VectorSynchronizer from './olcs/VectorSynchronizer.js';

import * as core from './olcs/core.ts';
import OLImageryProvider from './olcs/core/OLImageryProvider.js';
import VectorLayerCounterpart from './olcs/core/VectorLayerCounterpart.js';

import LazyLoader from './olcs/contrib/LazyLoader.js';
import Manager from './olcs/contrib/Manager.js';


export default OLCesium;

const olcs = window['olcs'] = {};
olcs.OLCesium = OLCesium;

olcs.AbstractSynchronizer = AbstractSynchronizer;
olcs.RasterSynchronizer = RasterSynchronizer;
olcs.VectorSynchronizer = VectorSynchronizer;

olcs.core = core;
olcs.core.OLImageryProvider = OLImageryProvider;
olcs.core.VectorLayerCounterpart = VectorLayerCounterpart;

olcs.contrib = {};
olcs.contrib.LazyLoader = LazyLoader;
olcs.contrib.Manager = Manager;
