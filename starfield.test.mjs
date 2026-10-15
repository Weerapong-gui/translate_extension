import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

function start(hidden = false) {
  const callbacks = new Map();
  const events = {};
  const heads = [];
  let id = 0;
  let draws = 0;
  const ctx = {
    setTransform() {}, beginPath() {}, arc() {}, fill() {},
    clearRect() {}, fillRect() { draws++; },
    createLinearGradient() { return { addColorStop() {} }; },
    moveTo(x, y) { heads.push([x, y]); }, lineTo() {}, stroke() {},
  };
  const document = {
    hidden,
    getElementById: () => ({ getContext: () => ctx }),
    addEventListener: (name, handler) => { events[name] = handler; },
  };
  runInNewContext(readFileSync(new URL('./starfield.js', import.meta.url), 'utf8'), {
    document,
    window: { innerWidth: 800, innerHeight: 600, addEventListener() {} },
    performance: { now: () => 0 },
    Math: Object.assign(Object.create(Math), { random: () => 0.5 }),
    requestAnimationFrame: callback => { callbacks.set(++id, callback); return id; },
    cancelAnimationFrame: handle => callbacks.delete(handle),
  });
  return {
    callbacks, heads,
    get draws() { return draws; },
    visibility(value) { document.hidden = value; events.visibilitychange?.(); },
    tick(time) {
      const [handle, callback] = callbacks.entries().next().value;
      callbacks.delete(handle);
      callback(time);
    },
  };
}

test('hidden tabs cancel frames and repeated visibility events never duplicate the loop', () => {
  const sky = start();
  sky.tick(10);
  assert.equal(sky.draws, 1);
  sky.visibility(true);
  assert.equal(sky.callbacks.size, 0);
  sky.visibility(false);
  sky.visibility(false);
  assert.equal(sky.callbacks.size, 1);
  sky.tick(100000);
  assert.equal(sky.draws, 2);
  assert.equal(sky.callbacks.size, 1);
});

test('a tab loaded in the background does not start rendering', () => {
  const sky = start(true);
  assert.equal(sky.callbacks.size, 0);
  assert.equal(sky.draws, 0);
  sky.visibility(false);
  assert.equal(sky.callbacks.size, 1);
});

test('shooting stars retain their position across a long hidden interval', () => {
  const sky = start();
  for (let time = 0; time <= 3400; time += 20) sky.tick(time);
  assert.ok(sky.heads.length > 0);
  const before = sky.heads.at(-1);
  const count = sky.heads.length;
  sky.visibility(true);
  sky.visibility(false);
  sky.tick(100000);
  assert.equal(sky.heads.length, count + 1);
  assert.deepEqual(sky.heads.at(-1), before);
});
