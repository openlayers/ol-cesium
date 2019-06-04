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
  BoxGeometry_default
} from "./chunk-GV56Q4LU.js";
import "./chunk-NKPBIX7F.js";
import "./chunk-46UD5ABS.js";
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
import {
  defined_default
} from "./chunk-UGK3FCDY.js";

// packages/engine/Source/Workers/createBoxGeometry.js
function createBoxGeometry(boxGeometry, offset) {
  if (defined_default(offset)) {
    boxGeometry = BoxGeometry_default.unpack(boxGeometry, offset);
  }
  return BoxGeometry_default.createGeometry(boxGeometry);
}
var createBoxGeometry_default = createBoxGeometry;
export {
  createBoxGeometry_default as default
};
