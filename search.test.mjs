import { test } from 'node:test';
import assert from 'node:assert/strict';
import { destination, remember, readHistory, searchShortcut } from './search-utils.mjs';

test('search shortcut uses physical slash in Thai and English without hijacking typing', () => {
  assert.equal(searchShortcut({ key: '/', code: 'Slash' }, false), 'focus');
  assert.equal(searchShortcut({ key: 'ฝ', code: 'Slash' }, false), 'focus');
  assert.equal(searchShortcut({ key: 'ฝ', code: 'Slash' }, true), null);
  assert.equal(searchShortcut({ key: '?', code: 'Slash', shiftKey: true }, false), null);
  for (const modifier of ['ctrlKey', 'metaKey', 'altKey', 'isComposing']) {
    assert.equal(searchShortcut({ key: 'ฝ', code: 'Slash', [modifier]: true }, false), null);
  }
  assert.equal(searchShortcut({ key: 'a', code: 'KeyA' }, false), null);
});

test('Escape closes suggestions regardless of keyboard layout but respects IME composition', () => {
  assert.equal(searchShortcut({ key: 'Escape', code: 'Escape' }, true), 'close');
  assert.equal(searchShortcut({ key: 'Unidentified', code: 'Escape' }, true), 'close');
  assert.equal(searchShortcut({ key: 'Escape', code: 'Escape', isComposing: true }, true), null);
});

test('domains and HTTP URLs navigate directly; other text searches safely', () => {
  for (const [input, expected] of [
    ['youtube.com', 'https://youtube.com/'],
    ['example.com/watch?v=1', 'https://example.com/watch?v=1'],
    ['http://localhost:8080/test', 'http://localhost:8080/test'],
    ['https://example.com', 'https://example.com/'],
    ['แมวน่ารัก', 'https://www.google.com/search?q=%E0%B9%81%E0%B8%A1%E0%B8%A7%E0%B8%99%E0%B9%88%E0%B8%B2%E0%B8%A3%E0%B8%B1%E0%B8%81'],
    ['hello world', 'https://www.google.com/search?q=hello+world'],
    ['javascript:alert(1)', 'https://www.google.com/search?q=javascript%3Aalert%281%29'],
    ['  ', null],
  ]) assert.equal(destination(input), expected);
});

test('history trims, deduplicates and keeps the ten most recent searches', () => {
  assert.deepEqual(remember(['old', 'cats'], ' cats '), ['cats', 'old']);
  assert.deepEqual(remember(['old'], ' '), ['old']);
  assert.deepEqual(remember(['1','2','3','4','5','6','7','8','9','10'], 'new'),
    ['new','1','2','3','4','5','6','7','8','9']);
});

test('invalid persisted history does not break search', () => {
  assert.deepEqual(readHistory('{bad'), []);
  assert.deepEqual(readHistory('{}'), []);
  assert.deepEqual(readHistory('["cats",null,4,"", "cats"]'), ['cats']);
});
