/**
 * @license
 * Cesium - https://github.com/CesiumGS/cesium
 * Version 1.130
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
} from "./chunk-LZFUG3GO.js";
import "./chunk-2AXPWBJG.js";
import "./chunk-EXEZHW3P.js";
import "./chunk-F4ZAKN4V.js";
import "./chunk-NWSAYFZG.js";
import "./chunk-J4MAVE6J.js";
import "./chunk-W6CPO62M.js";
import "./chunk-UK33ZN4K.js";
import "./chunk-VGJSKEIB.js";
import "./chunk-NR7KSD56.js";
import "./chunk-5OL6XFNS.js";
import "./chunk-HS76VTVY.js";
import "./chunk-WYCR5DWQ.js";
import {
  defined_default
} from "./chunk-FPYBD2P5.js";

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
