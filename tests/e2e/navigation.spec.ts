import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir } from 'node:fs/promises';
import articles from '../../Data/articles.json';
import media from '../../Data/media-literacy-scenarios.json';

test.beforeEach(async ({ page }) => {
  await page.route(
    /^https:\/\/([^/]+\.)?(googletagmanager\.com|google-analytics\.com|analytics\.google\.com)\//,
    (route) => route.abort(),
  );
  await page.addInitScript(() => localStorage.setItem('fc-consent', 'rejected'));
});

test('醒目主導覽可用鍵盤切頁，包含目前頁面與選票指南標示', async ({ page }) => {
  await page.goto('government/');
  const nav = page.getByRole('navigation', { name: '主要導覽' });
  await expect(nav.getByRole('link', { name: '政府怎麼運作', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  for (const link of await nav.getByRole('link').all()) {
    const bounds = await link.boundingBox();
    expect(bounds!.height).toBeGreaterThanOrEqual(44);
  }
  await nav.getByRole('link', { name: '民間監督', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/oversight\/$/);
  await expect(nav.getByRole('link', { name: '民間監督', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await page.getByLabel('搜尋團體、議題或公開資源').fill('經濟民主連合');
  await expect(page.locator('.oversight-organization')).toHaveCount(1);
  await page.locator('#org-edu > summary').click();
  await expect(page.locator('#org-edu')).toContainText('社團法人台灣經濟民主連合');
  await expect(page.locator('#org-edu')).toContainText('不是官方風險分數');
  await expect(
    page.locator('#org-edu').getByRole('link', { name: '國會觀察電子報及燈級說明' }),
  ).toHaveAttribute('href', 'https://www.edunion.org.tw/cw/');
  await nav.getByRole('link', { name: '我的選票指南', exact: true }).click();
  await expect(nav.getByRole('link', { name: '我的選票指南', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
});

test('手機與中型螢幕導覽有文字提示，可開關、捲動選項並切頁', async ({ page }) => {
  for (const viewport of [
    { width: 320, height: 700 },
    { width: 390, height: 844 },
    { width: 720, height: 390 },
    { width: 1024, height: 800 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('government/');
    const toggle = page.getByRole('button', { name: '開啟導覽', exact: true });
    await expect(toggle).toContainText('導覽');
    await toggle.click();
    await expect(page.getByRole('navigation', { name: '主要導覽' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.keyboard.press('Escape');
    await expect(toggle).toBeFocused();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.click();
    await page
      .getByRole('navigation', { name: '主要導覽' })
      .getByRole('link', { name: '我的選票指南', exact: true })
      .click();
    await expect(page).toHaveURL(/\/my-ballots\/$/);
    await expect(page.getByRole('button', { name: '開啟導覽' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  }
});

test('放大字體後手機主要頁面仍可閱讀且不水平溢出', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  for (const path of [
    './', 'government/', 'learn/', 'learn/democracy-and-rights/', 'justice/',
    'oversight/', 'my-ballots/', 'media-literacy/', 'about/', 'sources/', 'privacy/',
  ]) {
    await page.goto(path);
    await page.evaluate(() => { document.documentElement.style.fontSize = '20px'; });
    expect(await page.evaluate(() => getComputedStyle(document.body).fontSize)).toBe('20px');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), path).toBe(true);
  }
});

test('主選單切頁由頂端開始，平滑捲動不再把新頁往下帶', async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('./');
    for (const [label, path, start] of [
      ['司法與警檢', 'justice/', 0],
      ['政府怎麼運作', 'government/', 1600],
      ['民間監督', 'oversight/', 200],
      ['公民入門', 'learn/', 0],
      ['媒體識讀', 'media-literacy/', 500],
      ['關於本站', 'about/', 80],
      ['我的選票指南', 'my-ballots/', 0],
    ] as const) {
      await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), start);
      if (width === 390) await page.getByRole('button', { name: '開啟導覽', exact: true }).click();
      const nav = page.getByRole('navigation', { name: '主要導覽' });
      await nav.getByRole('link', { name: label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`/${path}$`));
      await expect(page.locator('#main-navigation a[aria-current="page"]')).toHaveText(label);
      // Sample after the route commits to catch delayed smooth-scroll movement.
      const maximumScroll = await page.evaluate(
        () =>
          new Promise<number>((resolve) => {
            let frames = 0;
            let maximum = window.scrollY;
            const sample = () => {
              maximum = Math.max(maximum, window.scrollY);
              if (++frames === 30) resolve(maximum);
              else requestAnimationFrame(sample);
            };
            requestAnimationFrame(sample);
          }),
      );
      expect(maximumScroll, `${width}px: ${label}`).toBe(0);
      await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
    }
  }
});

test('全部頁面都有Top，鍵盤回頂端保留選擇且減少動畫與無JS可用', async ({
  page,
  browser,
  baseURL,
}) => {
  test.setTimeout(60000);
  for (const path of [
    './',
    'learn/',
    'government/',
    'justice/',
    'oversight/',
    'my-ballots/',
    'media-literacy/',
    'about/',
    'sources/',
    'privacy/',
    'not-a-real-page/',
    ...articles.articles.map((article) => `learn/${article.slug}/`),
    ...media.scenarios.map((scenario) => `media-literacy/${scenario.slug}/`),
  ]) {
    await page.goto(path);
    await expect(page.locator('.back-to-top')).toHaveAttribute(
      'href',
      '#page-top',
    );
    await expect(page.locator('#page-top')).toHaveCount(1);
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('government/');
  await expect(page.locator('.back-to-top')).toBeHidden();
  await page.getByRole('button', { name: '地方政府', exact: true }).click();
  await page.evaluate(() =>
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }),
  );
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(1000);
  const top = page.getByRole('link', { name: 'Top 回到頂端', exact: true });
  await expect(top).toBeInViewport();
  await top.focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await expect(page.locator('.back-to-top')).toBeHidden();
  await expect(page.getByRole('button', { name: '地方政府', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  const accessibility = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(accessibility.violations.map((violation) => violation.id)).toEqual([]);
  await mkdir('.qa', { recursive: true });
  await page.screenshot({ path: '.qa/navigation-desktop-top.png' });
  const context = await browser.newContext({ javaScriptEnabled: false });
  const noJs = await context.newPage();
  await noJs.goto(baseURL + 'sources/');
  await noJs.evaluate(() =>
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }),
  );
  await noJs.getByRole('link', { name: 'Top 回到頂端', exact: true }).click();
  await expect.poll(() => noJs.evaluate(() => scrollY)).toBe(0);
  await context.close();
});
