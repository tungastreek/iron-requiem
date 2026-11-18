// Simulate dropped script requests without needing a browser or HTTP server.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const scriptList = file => Array.from(read(file).matchAll(/data-game-src="([^"]+)"/g), match => match[1]);
const scripts = scriptList('index.html');
const launcher = read('js/launch.js');

async function simulate(baseURI, failure) {
  const served = [], requested = [], errors = [], listeners = new Set();
  let booted = false, active = 0, finish;
  const done = new Promise(resolve => { finish = resolve; });
  const tagline = { textContent: 'Title' };
  const window = {
    addEventListener(kind, fn) { assert.equal(kind, 'error'); listeners.add(fn); },
    removeEventListener(kind, fn) { assert.equal(kind, 'error'); listeners.delete(fn); },
  };
  const context = {
    window, URL, location: new URL(baseURI), setTimeout(fn) { setImmediate(fn); },
    console: { error(error) { errors.push(error.message); setImmediate(finish); } },
    document: {
      baseURI,
      querySelector() { return tagline; },
      querySelectorAll() { return scripts.map(gameSrc => ({ dataset: { gameSrc } })); },
      createElement() { return { remove() {} }; },
      head: {
        appendChild(script) {
          const url = new URL(script.src);
          const file = scripts.find(name => url.pathname.endsWith('/' + name));
          assert(file, 'Unknown script ' + url.href);
          assert.equal(++active, 1, 'Only one script request may be active');
          const attempt = requested.filter(request => request.file === file).length;
          requested.push({ file, key: url.search });
          setImmediate(() => {
            active--;
            const state = failure(file, attempt);
            if (state === 'drop') {
              script.onerror();
              return;
            }
            if (state === 'throw') {
              for (const listener of listeners) listener({ filename: script.src, message: 'Invalid roster' });
            }
            served.push(file);
            script.onload();
          });
        },
      },
    },
    GAME: {
      boot() {
        assert.deepEqual(served, scripts);
        assert.equal(tagline.textContent, 'Title');
        booted = true;
        finish();
      },
    },
  };
  vm.runInNewContext(launcher, context);
  const timer = setTimeout(() => { throw new Error('Launcher did not settle'); }, 2000);
  try { await done; } finally { clearTimeout(timer); }
  assert.equal(listeners.size, 0, 'Clean up evaluation error listeners');
  return { booted, served, requested, errors, status: tagline.textContent };
}

async function run() {
  assert(scripts.length > 0);
  assert.deepEqual(scriptList('artifact.html'), scripts);
  for (const file of scripts) assert.doesNotThrow(() => fs.accessSync(path.join(root, file)));

  const http = 'http://localhost:8080/index.html';
  const pilots = 'js/data/pilots.js';
  const recovered = await simulate(http, (file, attempt) => file === pilots && attempt === 0 ? 'drop' : null);
  assert.equal(recovered.booted, true);
  assert.deepEqual(recovered.errors, []);
  const requests = recovered.requested.filter(request => request.file === pilots);
  assert.equal(requests.length, 2);
  assert.notEqual(requests[0].key, requests[1].key, 'A retry must bypass the previous request');
  assert(recovered.requested.every(request => request.key.startsWith('?launch=')));

  const missing = await simulate(http, file => file === pilots ? 'drop' : null);
  assert.equal(missing.booted, false);
  assert.equal(missing.requested.filter(request => request.file === pilots).length, 3);
  assert.equal(missing.requested.at(-1).file, pilots);
  assert.match(missing.status, /Reload to retry/);

  const invalid = await simulate(http, file => file === pilots ? 'throw' : null);
  assert.equal(invalid.booted, false);
  assert.equal(invalid.requested.filter(request => request.file === pilots).length, 1);
  assert.deepEqual(invalid.errors, ['Invalid roster']);

  const offline = await simulate('file:///Iron%20Requiem/index.html', () => null);
  assert.equal(offline.booted, true);
  assert(offline.requested.every(request => !request.key));
  console.log('Launch passed with a dropped request, permanent failure, invalid script, and offline paths.');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
