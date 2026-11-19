// Run with Playwright and Chromium installed. See tests/BROWSER_QA.md.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const [, , url, folder = '/tmp/iron-requiem-shots', , profile = 'desktop', mode = 'auto'] = process.argv;
const viewports = { desktop: { width: 1440, height: 900 }, phone: { width: 844, height: 390 }, portrait: { width: 390, height: 844 }, tablet: { width: 1024, height: 768 } };
async function main() {
  assert(url && viewports[profile], 'Pass URL, output folder, run, desktop|phone|portrait|tablet, and auto|low|high.');
  fs.mkdirSync(folder, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.IRON_BROWSER_EXECUTABLE });
  try {
    const page = await browser.newPage({ viewport: viewports[profile], hasTouch: profile !== 'desktop' });
    const errors = [];
    page.on('pageerror',error=>{errors.push(error.message);console.error('Browser error',error.message);});
    const shot = name => page.screenshot({ path: path.join(folder, profile + '-' + mode + '-' + name + '.png') });
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForFunction(() => !document.querySelector('#btnNew').disabled, null, { timeout: 120000 });
    await shot('title');
    await page.locator('#btnNew').click();
    await page.getByRole('button', { name: 'Rina Kasuga' }).click();
    assert.equal(await page.locator('#heroName').inputValue(), 'Rina Kasuga');
    await shot('pilot');
    await page.getByRole('button', { name: 'Choose robot' }).click();
    await page.getByRole('button', { name: /Super Robot/ }).click();
    await shot('robot');
    await page.getByRole('button', { name: 'Begin the story' }).click();
    await page.locator('#btnSkip').click();
    await page.getByRole('button', { name: 'Begin', exact: true }).click();
    await page.evaluate(value => { QUALITY.set(value); MAP.resize(); }, mode);
    await page.waitForSelector('#phaseBanner', { state: 'hidden' });
    assert.equal(await page.locator('#mapSize').textContent(), '18 × 10');
    assert.equal(await page.locator('#mapCanvas').getAttribute('data-board'), mode==='high' ? 'diorama' : mode==='low' ? 'flat' : await page.locator('#mapCanvas').getAttribute('data-board'));
    await shot('map');
    const fixture = await page.evaluate(() => {
      const ally = G.map.find('rei');
      const [first, second] = G.map.units.filter(u => u.team === 'enemy' && u.mech === 'crawler');
      first.x = ally.x + 1; first.y = ally.y; first.nameOverride = 'Crawler East';
      second.x = ally.x; second.y = ally.y - 1; second.nameOverride = 'Crawler North';
      return { hero: ally.mech, ally: [ally.x, ally.y], first: [first.x, first.y], second: [second.x, second.y],
        weapon: CB.weapons(ally)[0].name, art: !!ASSETS.portrait('beast', 'normal', 40, 50) };
    });
    assert.equal(fixture.hero, 'alteon_s');
    assert.equal(fixture.art, true);
    async function point([x, y]) {
      return page.evaluate(([x, y]) => {
        const canvas = document.getElementById('mapCanvas');
        const rect = canvas.getBoundingClientRect();
        const [px,py] = MAP.point(x+.5,y+.5);
        return [
          rect.left + px * rect.width / canvas.clientWidth,
          rect.top + py * rect.height / canvas.clientHeight,
        ];
      }, [x, y]);
    }
    async function select(tile) {
      const [x, y] = await point(tile);
      if (profile === 'desktop') await page.mouse.click(x, y);
      else await page.touchscreen.tap(x, y);
    }
    await select(fixture.ally);
    await page.waitForFunction(()=>MAP.ui.mode==='moving');
    await select(fixture.ally);
    await page.waitForFunction(()=>MAP.ui.mode==='menu');
    await page.locator('#actMenu').getByRole('button', { name: 'Attack' }).click();
    await page.locator('#wpnPanel').getByRole('button', { name: new RegExp(fixture.weapon) }).click();
    if (profile === 'desktop') await page.mouse.move(...await point(fixture.first));
    assert.equal(await page.locator('#forecast').isHidden(), true, 'Hover keeps the map clear');
    await select(fixture.first);
    const target = page.locator('#forecast .fside.enemy .fname');
    assert.equal(await target.textContent(), 'Crawler East');
    await select(fixture.second);
    assert.equal(await target.textContent(), 'Crawler North', 'Select a different target with the forecast open');
    await page.getByRole('button', { name: 'Clear target' }).click();
    assert.equal(await page.evaluate(() => MAP.ui.mode), 'target');
    assert.equal(await page.locator('#forecast').isHidden(), true);
    await select(fixture.first);
    await shot('forecast');
    const forecast = await page.locator('#forecast').boundingBox();
    const board = await page.locator('#mapWrap').boundingBox();
    const attack = await page.locator('#forecast').getByRole('button', { name: 'Attack' }).boundingBox();
    assert(forecast.x >= board.x + board.width - 1 || forecast.y >= board.y + board.height - 1, 'Forecast leaves the full board clickable');
    const [left, top] = await point([-.5, -.5]);
    const [right, bottom] = await point([17.5, 9.5]);
    assert(left >= board.x - 1 && top >= board.y - 1 && right <= board.x + board.width + 1 && bottom <= board.y + board.height + 1,
      'Opening the forecast keeps the 100% board in view');
    assert(forecast.x >= 0 && forecast.x + forecast.width <= viewports[profile].width + 1, 'Forecast fits the viewport');
    assert(attack.x >= 0 && attack.x + attack.width <= viewports[profile].width + 1, 'Attack button fits the viewport');
    await page.locator('#forecast').getByRole('button', { name: 'Attack' }).click();
    await page.locator('#battle').waitFor({ state: 'visible' });
    await shot('battle');
    if (profile==='desktop') {
      await page.waitForTimeout(2040);
      await shot('battle-effects');
    }
    await page.getByRole('button', { name: 'Skip animation' }).click();
    await page.locator('#battle').waitFor({ state: 'hidden' });
    const stats = await page.evaluate(()=>QUALITY.summary());
    console.log(JSON.stringify(stats));
    assert.deepEqual(errors, []);
    console.log('PASS: no page errors');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
