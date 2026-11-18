// Run with Playwright and Chromium installed. See tests/BROWSER_QA.md.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const [, , url, folder = '/tmp/iron-requiem-shots', , profile = 'desktop', mode = 'auto'] = process.argv;
const viewports = { desktop: { width: 1440, height: 900 }, phone: { width: 844, height: 390 }, tablet: { width: 1024, height: 768 } };
async function main() {
  assert(url && viewports[profile], 'Pass URL, output folder, run, desktop|phone|tablet, and auto|low|high.');
  fs.mkdirSync(folder, { recursive: true });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: viewports[profile], hasTouch: profile !== 'desktop' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
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
    await shot('map');
    const fixture = await page.evaluate(() => {
      const battle = G.map, ally = battle.units.find(u => u.pilot === 'rei'), enemy = battle.units.find(u => u.mech === 'crawler');
      enemy.x = ally.x + 1; enemy.y = ally.y;
      const weapon = CB.weapons(ally)[0];
      MAP.ui.sel = ally;
      MAP.beginAttack(ally, weapon);
      MAP.ui.target = enemy;
      UI.forecast(ally, enemy, weapon, true);
      return { hero: ally.mech, art: !!ASSETS.portrait('beast', 'normal', 40, 50) };
    });
    assert.equal(fixture.hero, 'alteon_s');
    assert.equal(fixture.art, true);
    await shot('forecast');
    const forecast = await page.locator('#forecast').boundingBox();
    const attack = await page.locator('#forecast').getByRole('button', { name: 'Attack' }).boundingBox();
    assert(forecast.x >= 0 && forecast.x + forecast.width <= viewports[profile].width + 1, 'Forecast fits the viewport');
    assert(attack.x >= 0 && attack.x + attack.width <= viewports[profile].width + 1, 'Attack button fits the viewport');
    await page.locator('#forecast').getByRole('button', { name: 'Attack' }).click();
    await page.locator('#battle').waitFor({ state: 'visible' });
    await shot('battle');
    await page.getByRole('button', { name: 'Skip animation' }).click();
    await page.locator('#battle').waitFor({ state: 'hidden' });
    assert.deepEqual(errors, []);
    console.log('PASS: no page errors');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
