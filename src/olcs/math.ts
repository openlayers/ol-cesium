/**
 * Converts radians to to degrees.
 *
 * @param angleInRadians Angle in radians.
 * @return Angle in degrees.
 */
export function toDegrees(angleInRadians: number): number {
  return angleInRadians * 180 / Math.PI;
}


/**
 * Converts degrees to radians.
 *
 * @param angleInDegrees Angle in degrees.
 * @return Angle in radians.
 */
export function toRadians(angleInDegrees: number): number {
  return angleInDegrees * Math.PI / 180;
}
