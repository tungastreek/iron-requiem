// Load classic scripts in dependency order, even on a small local HTTP server.
'use strict';
(() => {
  const tagline = document.querySelector('.tagline');
  const title = tagline.textContent;
  const web = /^https?:$/.test(location.protocol);
  const launch = Date.now().toString(36);

  function loadScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      let evaluationError;
      const capture = event => {
        if (event.filename === url.href) evaluationError = event.error || new Error(event.message);
      };
      const finish = loaded => {
        window.removeEventListener('error', capture);
        script.remove();
        if (evaluationError) reject(evaluationError);
        else resolve(loaded);
      };
      script.src = url.href;
      script.onload = () => finish(true);
      script.onerror = () => finish(false);
      window.addEventListener('error', capture);
      document.head.appendChild(script);
    });
  }

  async function start() {
    tagline.textContent = 'Loading game…';
    for (const entry of document.querySelectorAll('[data-game-src]')) {
      const path = entry.dataset.gameSrc;
      const url = new URL(path, document.baseURI);
      const attempts = web ? 3 : 1;
      let loaded = false;
      for (let attempt = 0; attempt < attempts && !loaded; attempt++) {
        if (attempt > 0) await new Promise(resolve => setTimeout(resolve, 250 * attempt));
        if (web) url.searchParams.set('launch', launch + '-' + attempt);
        loaded = await loadScript(url);
      }
      if (!loaded) throw new Error('Could not load ' + path + '.');
    }
    tagline.textContent = title;
    await GAME.boot();
  }

  start().catch(error => {
    console.error(error);
    tagline.textContent = 'Iron Requiem could not start. Reload to retry.';
  });
})();
