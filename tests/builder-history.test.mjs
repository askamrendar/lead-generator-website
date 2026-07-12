import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  initHistory,
  push,
  undo,
  redo,
  canUndo,
  canRedo,
} from '../lib/builder/editor/history.ts';

test('init has no undo/redo', () => {
  const h = initHistory('a');
  assert.equal(canUndo(h), false);
  assert.equal(canRedo(h), false);
  assert.equal(h.present, 'a');
});

test('push then undo returns previous; redo re-applies', () => {
  let h = initHistory('a');
  h = push(h, 'b');
  h = push(h, 'c');
  assert.equal(h.present, 'c');
  h = undo(h);
  assert.equal(h.present, 'b');
  h = undo(h);
  assert.equal(h.present, 'a');
  assert.equal(canUndo(h), false);
  h = redo(h);
  assert.equal(h.present, 'b');
});

test('push clears the redo stack', () => {
  let h = initHistory('a');
  h = push(h, 'b');
  h = undo(h); // present a, future [b]
  h = push(h, 'x');
  assert.equal(canRedo(h), false);
  assert.equal(h.present, 'x');
});

test('history is bounded by limit', () => {
  let h = initHistory('0', 3);
  for (let i = 1; i <= 10; i++) h = push(h, String(i));
  assert.equal(h.past.length, 3); // capped
  assert.equal(h.present, '10');
});

test('undo/redo are no-ops at the ends', () => {
  let h = initHistory('a');
  assert.equal(undo(h).present, 'a');
  assert.equal(redo(h).present, 'a');
});
