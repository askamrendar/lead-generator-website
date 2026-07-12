import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mimeToKind,
  isAllowedMime,
  safeFilename,
  formatBytes,
  matchesQuery,
} from '../lib/media/kind.ts';

test('mimeToKind classifies types', () => {
  assert.equal(mimeToKind('image/png'), 'IMAGE');
  assert.equal(mimeToKind('image/svg+xml'), 'ICON');
  assert.equal(mimeToKind('video/mp4'), 'VIDEO');
  assert.equal(mimeToKind('application/pdf'), 'DOCUMENT');
  assert.equal(mimeToKind('application/zip'), 'DOCUMENT');
});

test('isAllowedMime gates uploads', () => {
  assert.equal(isAllowedMime('image/jpeg'), true);
  assert.equal(isAllowedMime('application/pdf'), true);
  assert.equal(isAllowedMime('application/x-msdownload'), false);
});

test('safeFilename strips paths + unsafe chars', () => {
  assert.equal(safeFilename('../../etc/passwd'), 'passwd');
  assert.equal(safeFilename('my photo!.png'), 'my photo_.png');
  assert.ok(safeFilename('') === 'file');
});

test('formatBytes is human readable', () => {
  assert.equal(formatBytes(500), '500 B');
  assert.equal(formatBytes(2048), '2.0 KB');
  assert.equal(formatBytes(5 * 1024 * 1024), '5.0 MB');
});

test('matchesQuery searches filename, tags, alt', () => {
  const a = { filename: 'hero.png', altText: 'Front page banner', tags: ['brand', 'homepage'] };
  assert.equal(matchesQuery(a, 'hero'), true);
  assert.equal(matchesQuery(a, 'banner'), true);
  assert.equal(matchesQuery(a, 'homepage'), true);
  assert.equal(matchesQuery(a, 'nope'), false);
  assert.equal(matchesQuery(a, ''), true);
});
