import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  lifecycleBadge,
  generationBadge,
  seoBadge,
  deploymentBadge,
  domainBadge,
} from '../lib/websites/status.ts';

test('lifecycle badge maps each status', () => {
  assert.deepEqual(lifecycleBadge({ status: 'DRAFT' }), { label: 'Draft', tone: 'warning' });
  assert.equal(lifecycleBadge({ status: 'PUBLISHED' }).tone, 'success');
  assert.equal(lifecycleBadge({ status: 'GENERATED' }).tone, 'info');
  assert.equal(lifecycleBadge({ status: 'ARCHIVED' }).label, 'Archived');
});

test('generation badge reflects generatedAt / status', () => {
  assert.equal(generationBadge({ status: 'DRAFT' }).label, 'Not generated');
  assert.equal(generationBadge({ status: 'DRAFT', generatedAt: new Date() }).label, 'Generated');
  assert.equal(generationBadge({ status: 'PUBLISHED' }).label, 'Generated');
});

test('seo badge reflects a present config', () => {
  assert.equal(seoBadge({ status: 'DRAFT' }).label, 'Not configured');
  assert.equal(seoBadge({ status: 'DRAFT', seoConfig: {} }).label, 'Not configured');
  assert.equal(seoBadge({ status: 'DRAFT', seoConfig: { title: 'x' } }).label, 'Configured');
});

test('deployment and domain are placeholders for now', () => {
  assert.equal(deploymentBadge().label, 'Not deployed');
  assert.equal(domainBadge().label, 'No domain');
});
