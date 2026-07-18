import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  htmlPackRegistry,
  resolveHtmlPackId,
  getHtmlPack,
  isHtmlPackId,
  listHtmlPacks,
  DEFAULT_HTML_PACK_ID,
} from '../templates/html/registry.ts';

test('legacy royal-oak id aliases to template-1', () => {
  assert.equal(resolveHtmlPackId('royal-oak'), 'template-1');
  assert.equal(getHtmlPack('royal-oak').id, 'template-1');
});

test('missing/unknown ids fall back to the default pack', () => {
  assert.equal(resolveHtmlPackId(null), DEFAULT_HTML_PACK_ID);
  assert.equal(resolveHtmlPackId(undefined), DEFAULT_HTML_PACK_ID);
  assert.equal(resolveHtmlPackId(''), DEFAULT_HTML_PACK_ID);
  assert.equal(resolveHtmlPackId('no-such-pack'), DEFAULT_HTML_PACK_ID);
});

test('canonical ids resolve to themselves', () => {
  assert.equal(resolveHtmlPackId('template-1'), 'template-1');
  assert.equal(resolveHtmlPackId('template-2'), 'template-2');
});

test('display names are sequential, never business names', () => {
  const names = listHtmlPacks().map((p) => p.displayName);
  assert.deepEqual(names, ['Template 1', 'Template 2']);
  for (const name of names) assert.match(name, /^Template \d+$/);
});

test('isHtmlPackId is strict (no aliases, no unknowns)', () => {
  assert.equal(isHtmlPackId('template-1'), true);
  assert.equal(isHtmlPackId('template-2'), true);
  assert.equal(isHtmlPackId('royal-oak'), false);
  assert.equal(isHtmlPackId('bogus'), false);
});

test('every pack declares consistent asset locations and a full renderer', () => {
  for (const pack of Object.values(htmlPackRegistry)) {
    assert.ok(pack.assetDir.length > 0);
    assert.equal(pack.defaultAssetsBase, `/templates/${pack.assetDir}/assets`);
    for (const page of ['home', 'about', 'contact', 'servicesIndex', 'servicePage', 'areasIndex', 'areaPage']) {
      assert.equal(typeof pack.render[page], 'function', `${pack.id} missing ${page}`);
    }
  }
});
