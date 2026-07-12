import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidHostname,
  isSubdomain,
  apexOf,
  makeVerificationToken,
  expectedRecords,
  verifyRecordName,
} from '../lib/domains/dns.ts';

test('hostname validation accepts valid domains, rejects junk', () => {
  assert.equal(isValidHostname('example.com'), true);
  assert.equal(isValidHostname('shop.example.co.uk'), true);
  assert.equal(isValidHostname('not a domain'), false);
  assert.equal(isValidHostname('nodot'), false);
  assert.equal(isValidHostname('-bad.com'), false);
});

test('subdomain + apex detection', () => {
  assert.equal(isSubdomain('app.example.com'), true);
  assert.equal(isSubdomain('example.com'), false);
  assert.equal(apexOf('shop.app.example.com'), 'example.com');
});

test('verification token is prefixed + unique', () => {
  const a = makeVerificationToken();
  const b = makeVerificationToken();
  assert.ok(a.startsWith('lsp-verify-'));
  assert.notEqual(a, b);
});

test('expected records include a TXT verify record with the token', () => {
  const token = 'lsp-verify-abc';
  const apexRecords = expectedRecords('example.com', token);
  assert.ok(apexRecords.some((r) => r.type === 'TXT' && r.value === token));
  assert.ok(apexRecords.some((r) => r.type === 'A'));
  assert.ok(apexRecords.some((r) => r.type === 'CNAME' && r.name.startsWith('www.')));

  const subRecords = expectedRecords('app.example.com', token);
  assert.ok(subRecords.some((r) => r.type === 'CNAME' && r.name === 'app.example.com'));
  assert.equal(subRecords.some((r) => r.type === 'A'), false);
});

test('verifyRecordName targets the apex TXT record', () => {
  assert.equal(verifyRecordName('www.example.com'), '_lsp-verify.example.com');
});
