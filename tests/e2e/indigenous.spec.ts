import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('fc-consent', 'rejected'));
  await page.route(
    /^https:\/\/([^/]+\.)?(googletagmanager\.com|google-analytics\.com)\//,
    (route) => route.abort(),
  );
});

test('身分情境同時更新中央與地方提醒，不自行產生額外地方票', async ({ page }) => {
  await page.goto('my-ballots/');
  await page.getByRole('button', { name: '先看頭份市範例' }).click();
  for (const identity of ['plains', 'mountain']) {
    await page.getByLabel('選舉身分教學情境').selectOption(identity);
    await expect(page.locator('.lookup-results .ballot-card')).toHaveCount(8);
    await expect(page.locator('.lookup-results')).toContainText(
      identity === 'plains' ? '平地原住民立法委員' : '山地原住民立法委員',
    );
    await expect(page.locator('.ballot-election-note').first()).toContainText('公告及名冊');
    await expect(page.locator('.indigenous-result-note')).toContainText(
      identity === 'plains' ? '平地原住民情境' : '山地原住民情境',
    );
  }
  await page.getByLabel('戶籍縣市', { exact: true }).selectOption({ label: '桃園市' });
  await page.getByLabel('鄉鎮市區', { exact: true }).selectOption({ label: '復興區' });
  await page.getByRole('button', { name: '看看有哪些職務' }).click();
  await page.getByLabel('選舉身分教學情境').selectOption('general');
  await expect(page.locator('.lookup-results .ballot-card')).toHaveCount(8);
  await expect(page.locator('.lookup-results')).toContainText('復興區長');
  await expect(page.locator('.lookup-results')).toContainText('非原住民居民也可投票');
});

test('原住民中央地方比較可用鍵盤及無JS閱讀，相關政府角色有連結', async ({
  page,
  browser,
  baseURL,
}) => {
  await page.goto('government/');
  await page
    .getByRole('button', { name: /立法委員/ })
    .first()
    .click();
  await page.getByRole('link', { name: '看原住民選舉與投票資格差異' }).click();
  await expect(page).toHaveURL(/\/more\/#indigenous-guide$/);
  await expect(page.locator('#indigenous-guide-title')).toBeInViewport();
  const summary = page.locator('#indigenous-national > summary');
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#indigenous-national')).toHaveAttribute('open', '');
  await expect(page.locator('#indigenous-national')).toContainText('仍只圈一人');
  const context = await browser.newContext({ javaScriptEnabled: false });
  const noJs = await context.newPage();
  await noJs.goto(baseURL + 'more/');
  await noJs.locator('#indigenous-councils > summary').click();
  await expect(noJs.locator('#indigenous-councils > div')).toBeVisible();
  await expect(noJs.locator('#indigenous-councils')).toContainText('合併');
  await expect(noJs.locator('.indigenous-geography li')).toHaveCount(6);
  await noJs.locator('#indigenous-council-seats > summary').click();
  await expect(noJs.locator('.indigenous-seat-table tbody tr')).toHaveCount(22);
  await expect(noJs.locator('#indigenous-seat-63000')).toHaveText('臺北市110');
  await expect(noJs.locator('#indigenous-seat-65000')).toHaveText('新北市420');
  await expect(noJs.locator('#indigenous-seat-10013')).toHaveText('屏東縣180');
  await noJs.locator('#indigenous-council-combined > summary').click();
  await expect(noJs.locator('#indigenous-council-combined > div')).toContainText('仍限同一個縣市');
  await expect(noJs.locator('#indigenous-council-combined > div')).toContainText(
    '不是某縣市的現況',
  );
  await noJs.locator('#indigenous-council-jurisdiction > summary').click();
  await expect(noJs.locator('#indigenous-council-jurisdiction > div')).toContainText(
    '不能以臺北市議員的身分',
  );
  await context.close();
});

test('原住民比較在手機大字與深淺色可閱讀，展開內容通過無障礙檢查', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 850 });
  await page.goto('more/');
  for (const theme of ['light', 'dark']) {
    await page.evaluate((value) => localStorage.setItem('fc-color-theme', value), theme);
    await page.reload();
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '20px';
    });
    for (const id of ['national', 'councils', 'towns'])
      await page.locator(`#indigenous-${id} > summary`).click();
    await page.locator('#indigenous-council-seats > summary').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#indigenous-council-seats')).toHaveAttribute('open', '');
    for (const id of ['taipei', 'seat-rules', 'combined', 'jurisdiction', 'scope', 'legislator'])
      await page.locator(`#indigenous-council-${id} > summary`).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const result = await new AxeBuilder({ page })
      .include('#indigenous-guide')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(
      result.violations.map((item) => ({
        id: item.id,
        nodes: item.nodes.map((node) => node.target),
      })),
    ).toEqual([]);
  }
});
