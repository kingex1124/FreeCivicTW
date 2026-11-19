import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { IslandService } from '../../src/Service/IslandService';
const data = IslandService.get();
test.beforeEach(async ({ page }) => {
  await page.route(
    /^https:\/\/([^/]+\.)?(googletagmanager\.com|google-analytics\.com|analytics\.google\.com)\//,
    (route) => route.abort(),
  );
});
test('公民島整條頂列預設收起，展開後恢復原選單，可用鍵盤收合且重新進入仍收起', async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('./');
    const entry = page.locator('.home-island-entry');
    await expect(entry).toHaveAttribute('href', /\/civic-island\/$/);
    const entryBox = await entry.boundingBox();
    const eyebrowBox = await page.locator('.hero-copy > .eyebrow').boundingBox();
    expect(entryBox!.y + entryBox!.height).toBeLessThan(eyebrowBox!.y);
    await entry.click();
    await expect(page).toHaveURL(/\/civic-island\/$/);
    await expect(page.locator('.site-footer')).toBeHidden();
    const nav = page.getByRole('navigation', { name: '主要導覽' });
    const toggle = page.getByRole('button', { name: '展開網站頂列', exact: true });
    const bar = page.locator('#site-header-bar');
    await expect(bar).toBeHidden();
    await expect(bar).toHaveAttribute('inert', '');
    await expect(nav).toBeHidden();
    expect(
      await page.locator('.site-header').evaluate((el) => el.getBoundingClientRect().height),
    ).toBe(0);
    await expect
      .poll(async () => Math.round((await page.locator('.island-map').boundingBox())!.height))
      .toBe(900);
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(bar).toBeVisible();
    await expect(page.getByRole('button', { name: '切換深色模式', exact: true })).toBeVisible();
    if (width === 390) await page.getByRole('button', { name: '開啟導覽', exact: true }).click();
    await expect(nav).toBeVisible();
    const names = await nav.locator('.nav-links > a').allTextContents();
    expect(names.indexOf('公民島')).toBe(names.indexOf('媒體識讀') + 1);
    await expect(nav.getByRole('link', { name: '公民島', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    );
    const audit = await new AxeBuilder({ page })
      .include('.site-header')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(audit.violations.map((item) => item.id)).toEqual([]);
    if (width === 390) await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await expect(toggle).toBeFocused();
    await expect(bar).toBeHidden();
    await expect(bar).toBeHidden();
    await toggle.click();
    await page.getByRole('link', { name: 'FreeCivicTW 首頁', exact: true }).first().click();
    await expect(page.locator('.site-footer')).toBeVisible();
    await page.locator('.home-island-entry').click();
    await expect(bar).toBeHidden();
    await toggle.click();
    await page.reload();
    await expect(nav).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
});
test('公民島滿版呈現，點島名拉近並顯示建築標籤，點標籤或搜尋結果在地圖內開啟筆記', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('government/');
  await page
    .getByRole('navigation', { name: '主要導覽' })
    .getByRole('link', { name: '公民島', exact: true })
    .click();
  await expect(page).toHaveURL(/\/civic-island\/$/);
  await expect(page.locator('.island-map')).toHaveAttribute('data-scene', 'ready', {
    timeout: 20000,
  });
  await expect(page.locator('canvas[data-island-canvas]')).toBeVisible();
  await expect(page.getByRole('button', { name: /切換平面|切換立體/ })).toHaveCount(0);
  const map = await page.locator('.island-map').boundingBox(),
    panel = await page.locator('.island-panel').boundingBox();
  expect(map!.x).toBe(0);
  expect(panel!.x + panel!.width).toBe(1440);
  expect(map!.x + map!.width).toBe(panel!.x);
  await expect(page.locator('.island-building-label')).toHaveCount(data.nodes.length);
  await expect(page.locator('.island-building-label:visible')).toHaveCount(0);
  await page.locator('.island-world-label[data-group-id="courts"]').click();
  await expect(page.locator('.island-building-label:visible')).toHaveCount(
    data.nodes.filter((n) => n.group === 'courts').length,
  );
  const node = page.locator(
    '.island-building-label[data-node-id="courts-justice-district-courts"]',
  );
  await node.click();
  await expect(page.getByRole('dialog', { name: '地方法院', exact: true })).toBeVisible();
  expect(
    await page.locator('#island-note').evaluate((el) => Boolean(el.closest('#island-map'))),
  ).toBe(true);
  await expect(page.locator('.island-panel #island-note')).toHaveCount(0);
  await page.getByRole('button', { name: '關閉機關筆記', exact: true }).click();
  await expect(page.locator('#island-note')).toHaveCount(0);
  const groups = page.getByRole('navigation', { name: '島嶼分類' });
  await groups.getByRole('button', { name: /中央政府/ }).click();
  await expect(page.locator('.island-district-label:visible')).toHaveCount(8);
  await page.mouse.move(10, 10);
  await expect(page.locator('.island-building-label:visible')).toHaveCount(0);
  await page.locator('.island-district-label[data-district-id="central-infrastructure"]').click();
  await page.locator('.island-building-label[data-node-id="central-agency-central-motc"]').click();
  await expect(page.locator('#island-note-title')).toHaveText('交通部');
  await page.keyboard.press('Escape');
  await expect(page.locator('#island-note')).toHaveCount(0);
  await groups.getByRole('button', { name: /法院與審判/ }).click();
  await page.getByLabel('搜尋公民島機關與角色').fill('地方法院');
  const choice = page.locator('.island-directory').getByRole('button', { name: /地方法院/ });
  await choice.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#island-note-title')).toHaveText('地方法院');
  await expect(page.getByLabel('搜尋公民島機關與角色')).toHaveValue('地方法院');
  await page.keyboard.press('Escape');
  await expect(choice).toBeFocused();
  await page.getByRole('button', { name: '收合搜尋欄', exact: true }).click();
  await expect(page.locator('.island-panel')).toBeHidden();
  await expect(page.locator('.island-panel')).toHaveAttribute('inert', '');
  const expand = page.getByRole('button', { name: '展開搜尋欄', exact: true });
  await expect(expand).toHaveAttribute('aria-expanded', 'false');
  await expect
    .poll(async () => (await page.locator('.island-map').boundingBox())!.width)
    .toBe(1440);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expand.click();
  await expect(page.getByLabel('搜尋公民島機關與角色')).toHaveValue('地方法院');
  await expect(choice).toBeVisible();
  await expect
    .poll(async () => (await page.locator('.island-map').boundingBox())!.width)
    .toBe(map!.width);
  await page.getByLabel('搜尋公民島機關與角色').fill('不存在的機關XYZ');
  await expect(page.locator('.island-directory>button')).toHaveCount(0);
  await page.getByRole('button', { name: '清除搜尋與分類' }).click();
  await expect(page.locator('.island-directory>button')).toHaveCount(data.nodes.length);
  await page.getByRole('button', { name: '重設地圖視角', exact: true }).click();
  await expect(page.locator('.island-building-label:visible')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('中央與地方先顯示分區，拉近後只列該區機關，可切換所有分區並返回', async ({ page }) => {
  test.setTimeout(90000);
  await page.goto('civic-island/');
  await expect(page.locator('.island-map')).toHaveAttribute('data-scene', 'ready');
  for (const group of ['central', 'local']) {
    await page
      .getByRole('navigation', { name: '島嶼分類' })
      .getByRole('button', { name: group === 'central' ? /中央政府/ : /地方政府/ })
      .click();
    await page.mouse.move(10, 10);
    const districts = data.districts.filter((item) => item.group === group);
    await expect(page.locator('.island-district-label:visible')).toHaveCount(districts.length);
    await expect(page.locator('.island-building-label:visible')).toHaveCount(0);
    for (const district of districts) {
      await page
        .getByRole('navigation', { name: '島內職能分區' })
        .getByRole('button', { name: new RegExp('^' + district.name) })
        .click();
      await expect(page.locator('.island-three-canvas')).toHaveAttribute(
        'data-detail-district',
        district.id,
      );
      await expect
        .poll(() =>
          page
            .locator('.island-building-label:visible')
            .evaluateAll((elements) =>
              elements.map((el) => el.getAttribute('data-node-id')).sort(),
            ),
        )
        .toEqual([...district.members].sort());
    }
    await page.getByRole('button', { name: '回到島內分區', exact: true }).click();
    await expect(page.locator('.island-district-label:visible')).toHaveCount(districts.length);
    await expect(page.locator('.island-building-label:visible')).toHaveCount(0);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole('navigation', { name: '島內職能分區' })
    .getByRole('button', { name: /^民意與自治/ })
    .click();
  await expect(page.locator('#island-map')).toBeInViewport();
  await expect(page.locator('.island-three-canvas')).toHaveAttribute(
    'data-detail-district',
    'local-civic',
  );
  await expect(page.locator('.island-building-label:visible')).toHaveCount(
    data.districts.find((item) => item.id === 'local-civic')!.members.length,
  );
  for (const theme of ['light', 'dark']) {
    await page.evaluate((value) => (document.documentElement.dataset.theme = value), theme);
    const audit = await new AxeBuilder({ page })
      .include('.island-workspace')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(
      audit.violations.map((item) => ({
        id: item.id,
        nodes: item.nodes.map((node) => node.target),
      })),
      theme,
    ).toEqual([]);
  }
  await page.getByRole('button', { name: '回到島內分區', exact: true }).click();
  await expect(page.locator('.island-district-label:visible')).toHaveCount(8);
  await page.locator('.island-district-label[data-district-id="local-infrastructure"]').click();
  await expect(page.locator('.island-three-canvas')).toHaveAttribute(
    'data-detail-district',
    'local-infrastructure',
  );
  await expect(
    page.locator('.island-building-label[data-node-id="local-agency-local-transport"]'),
  ).toBeVisible();
  await page.setViewportSize({ width: 320, height: 900 });
  await page.evaluate(() => (document.documentElement.style.fontSize = '20px'));
  await page
    .getByRole('navigation', { name: '島內職能分區' })
    .getByRole('button', { name: /^民意與自治/ })
    .click();
  await expect(page.locator('#island-map')).toBeInViewport();
  await expect(page.locator('.island-three-canvas')).toHaveAttribute(
    'data-detail-district',
    'local-civic',
  );
  await expect
    .poll(() =>
      page
        .locator('.island-building-label:visible,.island-district-label:visible')
        .evaluateAll((elements) => {
          const boxes = elements.map((element) => ({
            name: element.textContent,
            rect: element.getBoundingClientRect(),
          }));
          return boxes.flatMap((a, index) =>
            boxes
              .slice(index + 1)
              .filter(
                (b) =>
                  Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left) > 2 &&
                  Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top) > 2,
              )
              .map((b) => [a.name, b.name]),
          );
        }),
    )
    .toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('遠景滑鼠指向建築顯示名稱，離開後收起，浮出的標籤可以開啟筆記', async ({ page }) => {
  await page.goto('civic-island/');
  await expect(page.locator('.island-map')).toHaveAttribute('data-scene', 'ready');
  const canvas = await page.locator('canvas[data-island-canvas]').boundingBox();
  const labels = page.locator('.island-building-label:visible');
  await expect(labels).toHaveCount(0);
  let hoverPoint = { x: 0, y: 0 };
  // Probe the visible building area rather than relying on renderer internals.
  for (const [x, y] of [
    [0.463, 0.29],
    [0.68, 0.33],
    [0.69, 0.35],
    [0.7, 0.37],
    [0.43, 0.28],
    [0.45, 0.3],
    [0.4, 0.31],
    [0.65, 0.43],
    [0.67, 0.4],
  ]) {
    hoverPoint = { x: canvas!.x + canvas!.width * x, y: canvas!.y + canvas!.height * y };
    await page.mouse.move(hoverPoint.x, hoverPoint.y);
    try {
      await expect(labels).toHaveCount(1, { timeout: 400 });
      break;
    } catch {
      /* Try another visible building if the point falls on a road. */
    }
  }
  await expect(labels).toHaveCount(1);
  const id = await labels.getAttribute('data-node-id');
  const name = data.nodes.find((node) => node.id === id)!.name;
  await expect(labels).toHaveText(name);
  await page.mouse.move(canvas!.x + 10, canvas!.y + canvas!.height - 100);
  await expect(labels).toHaveCount(0);
  // Returning to the same building restores its label; moving onto it keeps it open.
  await page.mouse.move(hoverPoint.x, hoverPoint.y);
  await expect(labels).toHaveCount(1);
  const hoveredName = await labels.innerText();
  await labels.hover();
  await expect(labels).toHaveCount(1);
  await labels.click();
  await expect(page.locator('#island-note-title')).toHaveText(hoveredName);
});

test('三段島嶼旅程可下一步、跳步、重來與結束，保留偵查和審判界線', async ({ page }) => {
  await page.goto('civic-island/');
  const choices = page.locator('.island-journey-choices');
  const expectLabel = async (nodeId: string) => {
    const label = page.locator(`.island-building-label[data-node-id="${nodeId}"]`);
    await expect(label).toBeVisible();
    await expect(label).toHaveAttribute('aria-pressed', 'true');
    await expect(label).toHaveText(data.nodes.find((node) => node.id === nodeId)!.name);
  };
  for (const journey of data.journeys) {
    await choices.getByRole('button', { name: journey.title }).click();
    await expect(page.locator('.island-map-trip')).toBeVisible();
    await expect(page.locator('.island-story-copy')).toContainText(journey.steps[0].title);
    await expectLabel(journey.steps[0].nodeId);
    await page.getByRole('button', { name: '旅程下一步', exact: true }).click();
    await expect(page.locator('.island-story-copy')).toContainText(journey.steps[1].title);
    await expectLabel(journey.steps[1].nodeId);
    await page.getByRole('button', { name: '旅程上一步', exact: true }).click();
    await expectLabel(journey.steps[0].nodeId);
    await page.locator('.island-story-steps button').last().click();
    await expectLabel(journey.steps.at(-1)!.nodeId);
    await page.getByRole('button', { name: '讀機關筆記', exact: true }).click();
    await expect(page.locator('#island-note-title')).toHaveText(
      data.nodes.find((n) => n.id === journey.steps.at(-1)!.nodeId)!.name,
    );
    await page.getByRole('button', { name: '關閉機關筆記', exact: true }).click();
    await expect(page.getByRole('button', { name: '旅程下一步', exact: true })).toBeDisabled();
    await page.locator('.island-story').getByRole('button', { name: '重來', exact: true }).click();
    await expect(page.locator('.island-story-copy')).toContainText(journey.steps[0].title);
    await page
      .locator('.island-story')
      .getByRole('button', { name: '結束導覽', exact: true })
      .click();
    await expect(page.locator('.island-map-trip')).toHaveCount(0);
  }
});
test('地圖上的小叉叉可用鍵盤結束情境，手機可操作並能重新開始', async ({ page }) => {
  for (const width of [1440, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('civic-island/');
    const choice = page.locator('.island-journey-choices > button').first();
    await choice.click();
    await page.getByRole('button', { name: '旅程下一步', exact: true }).click();
    const trip = page.locator('.island-map-trip');
    await expect(trip).toContainText('2 /');
    const close = trip.getByRole('button', { name: '結束情境導覽', exact: true });
    await expect(close).toBeInViewport();
    await close.focus();
    await close.press('Enter');
    await expect(trip).toHaveCount(0);
    await expect(page.locator('.island-story')).toHaveCount(0);
    await expect(choice).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByRole('button', { name: '重設地圖視角', exact: true })).toBeFocused();
    await expect(page.locator('#island-map')).toBeInViewport();
    await choice.click();
    await expect(trip).toContainText('1 /');
    await expect(page.getByRole('button', { name: '旅程上一步', exact: true })).toBeDisabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
test('沒有3D能力及手機也能探索，鍵盤操作、深淺色、大字與無障礙正常', async ({ page }) => {
  test.setTimeout(90000);
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type === 'webgl2' || type === 'webgl') return null;
      return Reflect.apply(getContext, this, [type, ...args]);
    } as typeof getContext;
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('civic-island/');
  await expect(page.locator('.island-map')).toHaveAttribute('data-scene', 'unavailable');
  await page.getByLabel('搜尋公民島機關與角色').fill('檢察官');
  const choice = page
    .locator('.island-directory>button')
    .filter({ has: page.getByText('檢察官', { exact: true }) });
  await choice.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#island-note-title')).toHaveText('檢察官');
  await page.getByRole('button', { name: '關閉機關筆記', exact: true }).click();
  await expect(page.locator('#island-map')).toBeInViewport();
  for (const theme of ['light', 'dark']) {
    await page.evaluate((value) => (document.documentElement.dataset.theme = value), theme);
    for (const width of [320, 390, 768, 1024, 1401, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => (document.documentElement.style.fontSize = '20px'));
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${theme} ${width}`,
      ).toBe(true);
    }
    await page.evaluate(() => (document.documentElement.style.fontSize = ''));
    const audit = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(
      audit.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
    ).toEqual([]);
  }
});
test('立體建築標籤與浮動筆記在深淺色可閱讀，手機可往返滿版地圖及搜尋清單', async ({ page }) => {
  test.setTimeout(90000);
  await page.goto('civic-island/');
  for (const theme of ['light', 'dark']) {
    await page.evaluate((value) => localStorage.setItem('fc-color-theme', value), theme);
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await expect(page.locator('.island-map')).toHaveAttribute('data-scene', 'ready');
    await page.locator('.island-world-label[data-group-id="courts"]').click();
    await expect(page.locator('.island-building-label:visible')).toHaveCount(
      data.nodes.filter((node) => node.group === 'courts').length,
    );
    const audit = await new AxeBuilder({ page })
      .include('.island-workspace')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(
      audit.violations.map((item) => ({
        id: item.id,
        nodes: item.nodes.map((node) => node.target),
      })),
      theme,
    ).toEqual([]);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: '重設地圖視角', exact: true }).click();
  await page.locator('.island-world-label[data-group-id="courts"]').click();
  await page
    .locator('.island-building-label[data-node-id="courts-justice-district-courts"]')
    .click();
  await expect(page.getByRole('dialog', { name: '地方法院', exact: true })).toBeVisible();
  const dialog = await page.locator('#island-note').boundingBox(),
    map = await page.locator('#island-map').boundingBox();
  expect(dialog!.x).toBeGreaterThanOrEqual(map!.x);
  expect(dialog!.x + dialog!.width).toBeLessThanOrEqual(map!.x + map!.width);
  expect(dialog!.y).toBeGreaterThanOrEqual(map!.y);
  expect(dialog!.y + dialog!.height).toBeLessThanOrEqual(map!.y + map!.height);
  await page.getByRole('button', { name: '關閉機關筆記', exact: true }).click();
  await page.getByRole('button', { name: '收合搜尋欄', exact: true }).click();
  await expect(page.locator('.island-panel')).toBeHidden();
  await page.locator('.island-open-directory').click();
  await expect(page.getByLabel('搜尋公民島機關與角色')).toBeInViewport();
  await page.getByLabel('搜尋公民島機關與角色').fill('地方法院');
  await page
    .locator('.island-directory')
    .getByRole('button', { name: /地方法院/ })
    .click();
  await expect(page.locator('#island-map')).toBeInViewport();
  await expect(page.getByRole('dialog', { name: '地方法院', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('公民島移除重複完整說明，無JS可連到原頁，保留來源、靜態SEO及sitemap', async ({
  browser,
  baseURL,
  request,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(baseURL + 'civic-island/');
    await expect(page.locator('.site-footer')).toBeHidden();
    await expect(page.getByText('關於這座公民島與資料來源', { exact: true })).toHaveCount(0);
    await expect(page.locator('.island-library')).toHaveCount(0);
    await expect(page.getByText('完整機關與角色說明', { exact: false })).toHaveCount(0);
    await expect(
      page.getByRole('link', { name: '政府怎麼運作的完整介紹', exact: true }),
    ).toHaveAttribute('href', /\/government\/$/);
    await expect(
      page.getByRole('link', { name: '司法與警檢完整介紹', exact: true }),
    ).toHaveAttribute('href', /\/justice\/$/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/civic-island\/$/,
    );
    const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').innerText());
    expect(schema.about).toHaveLength(5);
    expect(await (await request.get(baseURL + 'sitemap.xml')).text()).toContain('/civic-island/');
  } finally {
    await context.close();
  }
});
