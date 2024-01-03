import OLCesium from './olcs/OLCesium';

import AbstractSynchronizer from './olcs/AbstractSynchronizer';
import RasterSynchronizer from './olcs/RasterSynchronizer';
import VectorSynchronizer from './olcs/VectorSynchronizer';

import * as core from './olcs/core';
import OLImageryProvider from './olcs/core/OLImageryProvider';
import VectorLayerCounterpart from './olcs/core/VectorLayerCounterpart';

import LazyLoader from './olcs/contrib/LazyLoader';
import Manager from './olcs/contrib/Manager';


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
