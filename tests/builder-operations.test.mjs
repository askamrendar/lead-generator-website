import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ensureIds,
  addBlock,
  deleteBlock,
  duplicateBlock,
  moveBlock,
  moveBlockById,
  updateBlockProps,
  reorderBlocks,
  findBlock,
} from '../lib/builder/editor/operations.ts';

const page = () => ({
  title: 'Home',
  blocks: [
    { type: 'hero', id: 'hero-0', props: { title: 'Hi' } },
    { type: 'faq', id: 'faq-1' },
    { type: 'cta', id: 'cta-2' },
  ],
});

test('ensureIds assigns stable ids to id-less/duplicate blocks', () => {
  const r = ensureIds({ blocks: [{ type: 'hero' }, { type: 'faq' }, { type: 'hero', id: 'hero-0' }] });
  const ids = r.blocks.map((b) => b.id);
  assert.equal(new Set(ids).size, 3); // all unique
  assert.ok(ids.every(Boolean));
});

test('addBlock inserts at index and appends by default', () => {
  assert.equal(addBlock(page(), { type: 'stats', id: 's' }, 1).blocks[1].id, 's');
  assert.equal(addBlock(page(), { type: 'stats', id: 's' }).blocks.at(-1).id, 's');
});

test('deleteBlock removes by id (no-op if absent)', () => {
  assert.equal(deleteBlock(page(), 'faq-1').blocks.length, 2);
  assert.equal(deleteBlock(page(), 'nope').blocks.length, 3);
});

test('duplicateBlock inserts a fresh-id copy right after, deep-copying props', () => {
  const r = duplicateBlock(page(), 'hero-0', (t) => `${t}-copy`);
  assert.equal(r.blocks.length, 4);
  assert.equal(r.blocks[1].id, 'hero-copy');
  assert.notEqual(r.blocks[1].props, r.blocks[0].props); // new object
  assert.deepEqual(r.blocks[1].props, { title: 'Hi' });
});

test('moveBlock + moveBlockById reorder correctly', () => {
  assert.deepEqual(moveBlock(page(), 0, 2).blocks.map((b) => b.id), ['faq-1', 'cta-2', 'hero-0']);
  assert.deepEqual(moveBlockById(page(), 'cta-2', -1).blocks.map((b) => b.id), ['hero-0', 'cta-2', 'faq-1']);
  assert.deepEqual(moveBlockById(page(), 'hero-0', -1).blocks.map((b) => b.id), ['hero-0', 'faq-1', 'cta-2']); // clamp
});

test('updateBlockProps shallow-merges without touching others', () => {
  const r = updateBlockProps(page(), 'hero-0', { subtitle: 'Yo' });
  assert.deepEqual(findBlock(r, 'hero-0').props, { title: 'Hi', subtitle: 'Yo' });
  assert.equal(findBlock(r, 'faq-1').props, undefined);
});

test('reorderBlocks applies an id order and never drops unnamed blocks', () => {
  assert.deepEqual(reorderBlocks(page(), ['cta-2', 'hero-0', 'faq-1']).blocks.map((b) => b.id), ['cta-2', 'hero-0', 'faq-1']);
  assert.deepEqual(reorderBlocks(page(), ['cta-2']).blocks.map((b) => b.id), ['cta-2', 'hero-0', 'faq-1']);
});

test('operations are immutable (original page untouched)', () => {
  const p = page();
  deleteBlock(p, 'hero-0');
  moveBlock(p, 0, 2);
  assert.equal(p.blocks.length, 3);
  assert.equal(p.blocks[0].id, 'hero-0');
});
