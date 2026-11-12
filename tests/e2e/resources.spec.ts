import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { PublicResourceService } from '../../src/Service/PublicResourceService';

const data = PublicResourceService.get();
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('fc-consent', 'rejected'));
  await page.route(
    /^https:\/\/([^/]+\.)?(googletagmanager\.com|google-analytics\.com)\//,
    (route) => route.abort(),
  );
});

test('官方工具可從主選單進入，搜尋與篩選交集保留輸入，卡片提供正確外連及說明', async ({ page }) => {
  await page.goto('./');
  await page
    .getByRole('navigation', { name: '主要導覽' })
    .getByRole('link', { name: '便民查詢', exact: true })
    .click();
  await expect(page).toHaveURL(/\/resources\/$/);
  await page.getByRole('button', { name: '豬肉', exact: true }).click();
  const pork = page.locator('#resource-pork-dashboard');
  await expect(pork).toBeVisible();
  await expect(pork.locator('.resource-link')).toHaveAttribute(
    'href',
    'https://ifi.fda.gov.tw/ifi/pfp/cp/pfpcp0706q.jsp',
  );
  await pork.getByText('使用方法與注意事項', { exact: true }).click();
  await expect(pork.locator('details')).toHaveAttribute('open', '');
  const query = page.getByLabel('你想查什麼？');
  await query.fill('判決');
  await query.press('Enter');
  await expect(query).toHaveValue('判決');
  await expect(page.locator('#resource-judgments')).toBeVisible();
  await expect(page.locator('.resource-advanced')).toHaveAttribute('open', '');
  await page.getByLabel('單位類型', { exact: true }).selectOption('local');
  await expect(page.getByText('目前沒有符合的入口', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '清除全部篩選' }).click();
  await page.getByLabel('地區', { exact: true }).selectOption('臺北市');
  await page.getByLabel('入口種類', { exact: true }).selectOption('agency');
  await expect(page.locator('.resource-card')).toHaveCount(2);
  await expect(page.locator('#resource-local-taipei-council')).toBeVisible();
});

test('官方工具在無JavaScript可閱讀全部入口，具有metadata與靜態索引', async ({
  browser,
  baseURL,
  request,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(baseURL + 'resources/');
  await expect(page.locator('.resource-card')).toHaveCount(data.entries.length);
  await expect(page.locator('.resource-controls')).toBeHidden();
  const judgment = page.locator('#resource-judgments');
  await judgment.locator('summary').click();
  await expect(judgment).toContainText('同名不代表同一人');
  await expect(judgment.locator('details > div')).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/resources\/$/);
  const structured = await page.locator('script[type="application/ld+json"]').textContent();
  expect(JSON.parse(structured!).mainEntity.numberOfItems).toBe(data.entries.length);
  const sitemap = await request.get('sitemap.xml');
  expect(await sitemap.text()).toContain('/resources/');
  await context.close();
});

test('官方工具手機、桌機、放大字體及深淺色皆可閱讀，通過無障礙檢查', async ({ page }) => {
  test.setTimeout(90000);
  for (const theme of ['light', 'dark']) {
    await page.addInitScript((value) => localStorage.setItem('fc-color-theme', value), theme);
    await page.setViewportSize({ width: theme === 'dark' ? 390 : 1440, height: 900 });
    await page.goto('resources/');
    await page.getByRole('button', { name: '判決', exact: true }).click();
    await page.locator('#resource-judgments summary').click();
    await expect(page.locator('.resource-advanced')).toHaveAttribute('open', '');
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(result.violations.map((item) => item.id)).toEqual([]);
  }
  for (const width of [320, 390, 1024, 1401, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('resources/');
    if (width === 320)
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '20px';
      });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
});
