import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crc32, zipStore } from '../lib/export/zip.ts';
import { faviconSvg } from '../lib/export/favicon.ts';

const enc = new TextEncoder();

// --- crc32 ------------------------------------------------------------------

test('crc32 matches known vectors', () => {
  // Standard IEEE CRC-32 test vector.
  assert.equal(crc32(enc.encode('123456789')), 0xcbf43926);
  assert.equal(crc32(new Uint8Array(0)), 0);
  assert.equal(crc32(enc.encode('hello')), 0x3610a686);
});

// --- zipStore ---------------------------------------------------------------

function u32(bytes, off) {
  return (
    (bytes[off] | (bytes[off + 1] << 8) | (bytes[off + 2] << 16) | (bytes[off + 3] << 24)) >>> 0
  );
}
function u16(bytes, off) {
  return bytes[off] | (bytes[off + 1] << 8);
}

test('zipStore produces a valid single-entry archive', () => {
  const data = 'hello world';
  const bytes = zipStore([{ path: 'index.html', data }], new Date(2026, 0, 1));

  // Local file header signature.
  assert.equal(u32(bytes, 0), 0x04034b50);
  // Method STORE.
  assert.equal(u16(bytes, 8), 0);
  // CRC + sizes.
  assert.equal(u32(bytes, 14), crc32(enc.encode(data)));
  assert.equal(u32(bytes, 18), data.length);
  assert.equal(u32(bytes, 22), data.length);
  // Filename.
  const nameLen = u16(bytes, 26);
  assert.equal(nameLen, 'index.html'.length);
  const name = new TextDecoder().decode(bytes.slice(30, 30 + nameLen));
  assert.equal(name, 'index.html');

  // End-of-central-directory record exists with 1 entry.
  const eocdOff = bytes.length - 22;
  assert.equal(u32(bytes, eocdOff), 0x06054b50);
  assert.equal(u16(bytes, eocdOff + 10), 1);
});

test('zipStore handles multiple entries and nested paths', () => {
  const bytes = zipStore(
    [
      { path: 'index.html', data: 'home' },
      { path: 'about/index.html', data: 'about' },
      { path: 'assets/site.css', data: 'body{}' },
    ],
    new Date(2026, 0, 1),
  );
  const eocdOff = bytes.length - 22;
  assert.equal(u32(bytes, eocdOff), 0x06054b50);
  // 3 entries in the central directory.
  assert.equal(u16(bytes, eocdOff + 10), 3);
  // Central dir offset + size are consistent with the file length.
  const cdSize = u32(bytes, eocdOff + 12);
  const cdOffset = u32(bytes, eocdOff + 16);
  assert.equal(cdOffset + cdSize, eocdOff);
});

test('zipStore strips leading slashes and is deterministic for a fixed date', () => {
  const a = zipStore([{ path: '/index.html', data: 'x' }], new Date(2026, 0, 1));
  const b = zipStore([{ path: 'index.html', data: 'x' }], new Date(2026, 0, 1));
  assert.deepEqual(a, b);
});

// --- faviconSvg ---------------------------------------------------------------

test('faviconSvg renders the business initial on a brand tile', () => {
  const svg = faviconSvg('Empire Plumbing', '221 83% 53%');
  assert.match(svg, /^<svg /);
  assert.ok(svg.includes('>E</text>'));
  assert.ok(svg.includes('hsl(221 83% 53%)'));
});

test('faviconSvg escapes XML and falls back on empty names', () => {
  assert.ok(faviconSvg('<script>', '0 0% 0%').includes('&lt;'));
  assert.ok(faviconSvg('   ', '0 0% 0%').includes('>S</text>'));
});
