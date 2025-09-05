import type { Point } from './types';

/**
 * Rotates a point around a center point by a given angle.
 * @param point The point to rotate.
 *param center The center of rotation.
 * @param angle The angle of rotation in degrees.
 * @returns The new rotated point.
 */
export const rotatePoint = (point: Point, center: Point, angle: number): Point => {
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const translatedX = point.x - center.x;
    const translatedY = point.y - center.y;
    return {
        x: translatedX * cos - translatedY * sin + center.x,
        y: translatedX * sin + translatedY * cos + center.y,
    };
};
