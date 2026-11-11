import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir } from 'node:fs/promises';
import data from '../../Data/civil-oversight.json';

test.beforeEach(async ({ page }) => {
  await page.route(
    /^https:\/\/([^/]+\.)?(googletagmanager\.com|google-analytics\.com|analytics\.google\.com)\//,
    (route) => route.abort(),
  );
  await page.addInitScript(() => localStorage.setItem('fc-consent', 'rejected'));
});

test('民間監督可從主導覽進入，支援複合篩選、無結果及批次閱讀', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('government/');
  await expect(page.locator('.scope-switch button')).toHaveText(['中央政府', '地方政府']);
  await expect(page.locator('#citizen-oversight')).toHaveCount(0);
  await page
    .getByRole('navigation', { name: '主要導覽' })
    .getByRole('link', { name: '民間監督', exact: true })
    .click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('持續看著權力');
  await expect(page.locator('.oversight-organization')).toHaveCount(data.organizations.length);
  await page.getByLabel('主要關注範圍').selectOption('local');
  await expect(page.locator('.oversight-organization')).toHaveCount(
    data.organizations.filter((item) => item.scope === 'local').length,
  );
  await page.getByLabel('搜尋團體、議題或公開資源').fill('臺 南 新 芽');
  await expect(page.locator('.oversight-organization')).toHaveCount(1);
  const filters = page.getByRole('group', { name: '監督主題篩選' });
  await filters.getByRole('button', { name: '司法與人權', exact: true }).click();
  await expect(page.locator('.oversight-empty')).toBeVisible();
  await page.locator('.oversight-empty').getByRole('button', { name: '清除篩選' }).click();
  await expect(page.locator('.oversight-organization')).toHaveCount(data.organizations.length);
  await page.getByRole('button', { name: '展開目前結果' }).click();
  await expect(page.locator('.oversight-organization[open]')).toHaveCount(
    data.organizations.length,
  );
  await page.getByRole('button', { name: '收合目前結果' }).click();
  await expect(page.locator('.oversight-organization[open]')).toHaveCount(0);
  const ccw = page.locator('#org-ccw');
  await ccw.locator(':scope > summary').focus();
  await page.keyboard.press('Enter');
  await expect(ccw).toHaveAttribute('open');
  await expect(ccw).toContainText('不等於政府法定考核或司法裁判');
  expect(errors).toEqual([]);
});

test('人民及選票指南中的公督盟連結前往新頁並展開內容', async ({ page }) => {
  await page.goto('government/');
  await page
    .locator('.role-grid')
    .getByRole('button', { name: /人民與公民參與/ })
    .click();
  await page
    .locator('.role-inspector')
    .getByRole('link', { name: '用公督盟資料練習檢視立委表現' })
    .click();
  await expect(page).toHaveURL(/\/oversight\/#org-ccw$/);
  await expect(page.locator('#org-ccw')).toHaveAttribute('open');
  await expect(page.locator('#org-ccw > summary')).toBeInViewport();
  await page.goto('my-ballots/');
  await page.getByRole('button', { name: '先看頭份市範例' }).click();
  await page.getByLabel('立委票別教學情境').selectOption('general');
  const card = page
    .locator('.ballot-card')
    .filter({ has: page.locator('summary').getByText('區域立法委員', { exact: true }) });
  await card.locator('summary').click();
  await card.getByRole('link', { name: '用公督盟資料練習檢視立委表現' }).click();
  await expect(page).toHaveURL(/\/oversight\/#org-ccw$/);
  await expect(page.locator('#org-ccw')).toHaveAttribute('open');
});

test('民間監督完整內容在無JavaScript可讀，且有靜態SEO與sitemap', async ({
  browser,
  baseURL,
  request,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(baseURL + 'oversight/');
  await expect(page.locator('.oversight-controls')).toBeHidden();
  await expect(page.locator('.oversight-organization')).toHaveCount(data.organizations.length);
  for (const organization of data.organizations) {
    const item = page.locator(`#org-${organization.id}`);
    if ((await item.getAttribute('open')) === null) {
      // Native details remains interactive without client JavaScript.
      await item.locator(':scope > summary').click();
    }
    await expect(item.locator('.oversight-organization-body')).toBeVisible();
    await expect(item).toContainText('權限界線與閱讀提醒');
  }
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    (process.env.TEST_CANONICAL_ORIGIN
      ? process.env.TEST_CANONICAL_ORIGIN + (process.env.NEXT_PUBLIC_BASE_PATH ?? '') + '/'
      : baseURL) + 'oversight/',
  );
  const jsonLd = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent())!,
  );
  expect(jsonLd.mainEntity.numberOfItems).toBe(data.organizations.length);
  expect(await (await request.get(baseURL + 'sitemap.xml')).text()).toContain('/oversight/');
  await context.close();
});

test('民間監督在桌機中型螢幕及手機可閱讀、通過無障礙檢查', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mkdir('.qa', { recursive: true });
  for (const width of [1440, 1024, 900, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('oversight/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.locator('#org-ccw > summary').click();
    await expect(page.locator('#org-ccw')).toHaveAttribute('open');
    if (width === 1440 || width === 390) {
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(
        results.violations.map((violation) => ({
          id: violation.id,
          nodes: violation.nodes.map((node) => node.target),
        })),
      ).toEqual([]);
      await page.screenshot({ path: `.qa/oversight-${width}.png` });
      if (width === 390) {
        await page.getByRole('button', { name: '開啟導覽' }).click();
        await expect(
          page
            .getByRole('navigation', { name: '主要導覽' })
            .getByRole('link', { name: '民間監督', exact: true }),
        ).toBeVisible();
      }
    }
  }
});
