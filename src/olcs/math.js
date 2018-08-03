/**
 * Converts radians to to degrees.
 *
 * @param {number} angleInRadians Angle in radians.
 * @return {number} Angle in degrees.
 */
export function toDegrees(angleInRadians) {
  return angleInRadians * 180 / Math.PI;
}


/**
 * Converts degrees to radians.
 *
 * @param {number} angleInDegrees Angle in degrees.
 * @return {number} Angle in radians.
 */
export function toRadians(angleInDegrees) {
  return angleInDegrees * Math.PI / 180;
}
