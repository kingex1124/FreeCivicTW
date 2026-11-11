import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';

test.beforeEach(async ({ page }) => {
  await page.route(
    /^https:\/\/([^/]+\.)?(googletagmanager\.com|google-analytics\.com|analytics\.google\.com)\//,
    (route) => route.abort(),
  );
  await page.addInitScript(() => localStorage.setItem('fc-consent', 'rejected'));
});

test('右上角切換全站深淺色，切頁重整保留偏好，舊動畫設定不生效', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => localStorage.setItem('fc-reduced-motion', 'true'));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('./');
  const lightBackground = await page.evaluate(
    () => getComputedStyle(document.body).backgroundColor,
  );
  await page.getByRole('button', { name: '切換深色模式', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).not.toBe(
    lightBackground,
  );
  await page
    .getByRole('navigation', { name: '主要導覽' })
    .getByRole('link', { name: '政府怎麼運作', exact: true })
    .click();
  await expect(page).toHaveURL(/\/government\/$/);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('button', { name: '切換淺色模式', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('button', { name: '減少動畫' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '開啟動畫' })).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'full');
  await page.locator('.agency-picker-trigger').click();
  expect(
    await page
      .locator('.agency-picker-dialog')
      .evaluate((dialog) => getComputedStyle(dialog).animationName),
  ).not.toBe('none');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: '切換淺色模式', exact: true }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(
    lightBackground,
  );
  expect(errors).toEqual([]);
});

test('深色偏好在互動程式載入前套用，儲存受限時仍可切換', async ({ page, browser, baseURL }) => {
  await page.addInitScript(() => localStorage.setItem('fc-color-theme', 'dark'));
  await page.route(/\/_next\/static\/.*\.js(?:\?|$)/, (route) => route.abort());
  await page.goto('government/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe(
    'dark',
  );
  const blocked = await browser.newContext();
  const blockedPage = await blocked.newPage();
  await blockedPage.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error('Storage blocked');
    };
    Storage.prototype.setItem = () => {
      throw new Error('Storage blocked');
    };
  });
  await blockedPage.goto(baseURL!);
  await blockedPage.getByRole('button', { name: '切換深色模式', exact: true }).click();
  await expect(blockedPage.locator('html')).toHaveAttribute('data-theme', 'dark');
  await blockedPage.getByRole('button', { name: '切換淺色模式', exact: true }).click();
  await expect(blockedPage.locator('html')).toHaveAttribute('data-theme', 'light');
  await blocked.close();
});

test('深色模式涵蓋所有主要頁面及互動狀態，檢查文字對比', async ({ page }) => {
  test.setTimeout(90000);
  await page.addInitScript(() => localStorage.setItem('fc-color-theme', 'dark'));
  const failures: unknown[] = [];
  await mkdir('.qa', { recursive: true });
  for (const path of [
    './',
    'learn/',
    'government/',
    'justice/',
    'oversight/',
    'my-ballots/',
    'media-literacy/',
    'learn/local-government/',
    'media-literacy/headline-context/',
    'about/',
    'sources/',
    'privacy/',
  ]) {
    await page.goto(path);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    if (path === 'government/') await page.locator('.agency-picker-trigger').click();
    if (path === 'justice/')
      await page.getByRole('button', { name: '查看檢察官', exact: true }).click();
    if (path === 'oversight/') await page.locator('#org-ccw > summary').click();
    if (path === 'my-ballots/') {
      await page.getByRole('button', { name: '先看頭份市範例' }).click();
      await page.locator('.ballot-card > summary').first().click();
    }
    if (path === 'media-literacy/headline-context/') {
      await page.getByRole('radio').first().check();
      await page.getByRole('button', { name: '看看解析', exact: true }).click();
    }
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    if (result.violations.length)
      failures.push({
        path,
        violations: result.violations.map((item) => ({
          id: item.id,
          nodes: item.nodes.map((node) => ({ target: node.target, summary: node.failureSummary })),
        })),
      });
    if (['./', 'government/', 'justice/'].includes(path))
      await page.screenshot({
        path: `.qa/theme-dark-${path === './' ? 'home' : path.replace('/', '')}.png`,
        fullPage: false,
      });
  }
  await writeFile('.qa/theme-accessibility.json', JSON.stringify(failures, null, 2));
  expect(failures).toEqual([]);
});

test('深色模式在手機、平板與桌機不溢出，手機選單與切換可操作', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('fc-color-theme', 'dark'));
  for (const width of [320, 390, 1024, 1101, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('government/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (width === 390) {
      await page.getByRole('button', { name: '開啟導覽', exact: true }).click();
      const result = await new AxeBuilder({ page })
        .include('.site-header')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(result.violations.map((item) => item.id)).toEqual([]);
      await page.screenshot({ path: '.qa/theme-dark-mobile-menu.png' });
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: '切換淺色模式', exact: true }).click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
      await page.getByRole('button', { name: '切換深色模式', exact: true }).click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    }
  }
});
