type Rect = {left: number; top: number; right: number; bottom: number};
type Viewport = {left: number; top: number; width: number; height: number};
export type GuidePlacement = {
 left: number; top: number;
 pointer?: {left: number; top: number; side: "left" | "right" | "top" | "bottom"};
};
const inset = 12, gap = 16, corner = 24;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));
export function placeGuide(target: Rect, card: {width: number; height: number}, viewport: Viewport, safeBottom = 0): GuidePlacement {
 const {width, height} = card;
 const minLeft = viewport.left + inset, maxLeft = viewport.left + viewport.width - width - inset;
 const minTop = viewport.top + inset, maxTop = viewport.top + viewport.height - height - inset;
 const mobile = viewport.width <= 600;
 let left = mobile ? minLeft : clamp(target.left, minLeft, maxLeft);
 let top = viewport.top + viewport.height - height - Math.max(gap, safeBottom);
 if (mobile) {
  if (target.bottom > top && target.top - height - gap >= minTop) top = target.top - height - gap;
 } else if (target.right + gap + width <= viewport.left + viewport.width - inset) {
  left = target.right + gap; top = target.top;
 } else if (target.bottom + gap + height <= viewport.top + viewport.height - inset) {
  top = target.bottom + gap;
 } else if (target.top - height - gap >= minTop) {
  top = target.top - height - gap;
 } else if (target.left - gap - width >= minLeft) {
  left = target.left - gap - width; top = target.top;
 }
 left = clamp(left, minLeft, maxLeft); top = clamp(top, minTop, maxTop);
 const result: GuidePlacement = {left, top};
 const targetX = (target.left + target.right) / 2, targetY = (target.top + target.bottom) / 2;
 // A pointer is meaningful only when it can point directly at the visible target.
 if (target.right <= left - gap && left - target.right <= gap + 1 && target.bottom > top + corner && target.top < top + height - corner) {
  result.pointer = {left: left - 5, top: clamp(targetY, top + corner, top + height - corner) - 5, side: "left"};
 } else if (target.left >= left + width + gap && target.left - left - width <= gap + 1 && target.bottom > top + corner && target.top < top + height - corner) {
  result.pointer = {left: left + width - 5, top: clamp(targetY, top + corner, top + height - corner) - 5, side: "right"};
 } else if (target.bottom <= top - gap && top - target.bottom <= gap + 1 && target.right > left + corner && target.left < left + width - corner) {
  result.pointer = {left: clamp(targetX, left + corner, left + width - corner) - 5, top: top - 5, side: "top"};
 } else if (target.top >= top + height + gap && target.top - top - height <= gap + 1 && target.right > left + corner && target.left < left + width - corner) {
  result.pointer = {left: clamp(targetX, left + corner, left + width - corner) - 5, top: top + height - 5, side: "bottom"};
 }
 return result;
}
