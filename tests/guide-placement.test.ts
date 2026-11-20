import assert from 'node:assert/strict';
import test from 'node:test';
import { placeGuide } from '../src/core/guide-placement';

const card = {width: 336, height: 200};
const viewport = {left: 0, top: 0, width: 1280, height: 800};

test('desktop guide points to its target with a 16px gap', () => {
 const result = placeGuide({left: 100, top: 100, right: 500, bottom: 220}, card, viewport);
 assert.equal(result.left, 516);
 assert.equal(result.top, 100);
 assert.equal(result.pointer?.side, 'left');
});

test('desktop guide falls below, above, or left when space is limited', () => {
 assert.equal(placeGuide({left: 900, top: 100, right: 1200, bottom: 220}, card, viewport).pointer?.side, 'top');
 assert.equal(placeGuide({left: 900, top: 600, right: 1200, bottom: 720}, card, viewport).pointer?.side, 'bottom');
 const result = placeGuide({left: 900, top: 100, right: 1200, bottom: 720}, {width: 336, height: 600}, viewport);
 assert.equal(result.left, 548);
 assert.equal(result.pointer?.side, 'right');
});

test('mobile guide stays within narrow viewports and clears fixed bottom actions', () => {
 for (const width of [320, 390, 600]) {
  const screen = {...viewport, width, height: 844};
  const size = {width: width - 24, height: 220};
  const result = placeGuide({left: 12, top: 40, right: width - 12, bottom: 100}, size, screen);
  assert.equal(result.left, 12);
  assert.equal(result.top, 608);
  assert.equal(result.pointer, undefined);
  const fixedAction = {left: 12, top: 750, right: width - 12, bottom: 820};
  const above = placeGuide(fixedAction, size, screen);
  assert.equal(above.top + size.height, fixedAction.top - 16);
  assert.equal(above.pointer?.side, 'bottom');
 }
});

test('guide uses the visual viewport offsets, keyboard height, and safe area', () => {
 const screen = {left: 30, top: 40, width: 390, height: 420};
 const result = placeGuide({left: 42, top: 60, right: 400, bottom: 100}, {width: 366, height: 220}, screen, 34);
 assert.equal(result.left, 42);
 assert.equal(result.top, 206);
 assert.ok(result.top + 220 <= screen.top + screen.height - 34);
});

test('large overlapping targets do not get a misleading pointer', () => {
 const result = placeGuide({left: 20, top: 20, right: 1200, bottom: 1200}, card, viewport);
 assert.equal(result.pointer, undefined);
 assert.ok(result.left >= 12 && result.left + card.width <= viewport.width - 12);
 assert.ok(result.top >= 12 && result.top + card.height <= viewport.height - 12);
});
