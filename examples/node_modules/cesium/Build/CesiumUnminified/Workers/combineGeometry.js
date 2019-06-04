/**
 * @license
 * Cesium - https://github.com/CesiumGS/cesium
 * Version 1.114
 *
 * Copyright 2011-2022 Cesium Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Columbus View (Pat. Pend.)
 *
 * Portions licensed separately.
 * See https://github.com/CesiumGS/cesium/blob/main/LICENSE.md for full licensing details.
 */

import {
  PrimitivePipeline_default
} from "./chunk-UAEW6HKG.js";
import {
  createTaskProcessorWorker_default
} from "./chunk-ODW7WYM4.js";
import "./chunk-DTAIXKTO.js";
import "./chunk-LZGHD6NY.js";
import "./chunk-R5X4OQT4.js";
import "./chunk-WBQCVXR3.js";
import "./chunk-VRGFV2UO.js";
import "./chunk-XWXM2O2R.js";
import "./chunk-S6SKF6DT.js";
import "./chunk-VK3EJHWI.js";
import "./chunk-JY5YEZFA.js";
import "./chunk-F6SE42BK.js";
import "./chunk-WZU2YLWG.js";
import "./chunk-QZAD5O7I.js";
import "./chunk-GEJTYLCO.js";
import "./chunk-72SANQJV.js";
import "./chunk-RV7ZYPFT.js";
import "./chunk-6HZQPRUS.js";
import "./chunk-JXDC723O.js";
import "./chunk-5M3U6ZMA.js";
import "./chunk-S4MAZ3SS.js";
import "./chunk-UGK3FCDY.js";

// packages/engine/Source/Workers/combineGeometry.js
function combineGeometry(packedParameters, transferableObjects) {
  const parameters = PrimitivePipeline_default.unpackCombineGeometryParameters(
    packedParameters
  );
  const results = PrimitivePipeline_default.combineGeometry(parameters);
  return PrimitivePipeline_default.packCombineGeometryResults(
    results,
    transferableObjects
  );
}
var combineGeometry_default = createTaskProcessorWorker_default(combineGeometry);
export {
  combineGeometry_default as default
};
