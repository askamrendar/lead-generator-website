import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scorePassword } from '../lib/auth/password-strength.ts';

test('empty password scores 0 with a prompt', () => {
  const r = scorePassword('');
  assert.equal(r.score, 0);
  assert.equal(r.label, 'Empty');
  assert.ok(r.suggestions.length > 0);
});

test('short passwords are capped at Weak regardless of variety', () => {
  const r = scorePassword('Aa1!'); // 4 chars, full variety but < 8
  assert.ok(r.score <= 1);
  assert.ok(r.suggestions.includes('Use at least 8 characters'));
});

test('a long, varied password scores Strong with no suggestions', () => {
  const r = scorePassword('Str0ng&Secret!');
  assert.equal(r.score, 4);
  assert.equal(r.label, 'Strong');
  assert.deepEqual(r.suggestions, []);
});

test('score increases with variety', () => {
  const weak = scorePassword('aaaaaaaa'); // 8 lower only
  const better = scorePassword('aaaaAAAA1'); // lower+upper+digit, 9 chars
  assert.ok(better.score > weak.score);
});

test('suggestions name the missing character classes', () => {
  const r = scorePassword('alllowercase'); // 12 lower only
  assert.ok(r.suggestions.includes('Add an uppercase letter'));
  assert.ok(r.suggestions.includes('Add a number'));
  assert.ok(r.suggestions.includes('Add a symbol'));
});

test('score is always within 0..4', () => {
  for (const pw of ['', 'a', 'Ab1!xyzQ', ' verylongpassphrasewithspaces 123 !!']) {
    const { score } = scorePassword(pw);
    assert.ok(score >= 0 && score <= 4);
  }
});
