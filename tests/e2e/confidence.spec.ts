import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import data from '../../Data/cabinet-confidence.json';

test.beforeEach(async ({ page }) => {
  await page.route(
    /^https:\/\/([^/]+\.)?(googletagmanager\.com|google-analytics\.com|analytics\.google\.com)\//,
    (route) => route.abort(),
  );
});

test('倒閣主題可從政府目錄進入，鍵盤閱讀三種結果及各時限，手機可返回', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('government/');
  const nav = page.getByRole('navigation', { name: '政府內容導覽' });
  await nav.getByRole('link', { name: /^倒閣與重選/ }).click();
  const topic = page.locator('#cabinet-confidence');
  await expect(page.locator('#cabinet-confidence-title')).toBeInViewport();
  await expect(topic.locator('details[open]')).toHaveCount(0);
  await expect(topic.locator('.more-notice')).toContainText('通過但未解散');
  await topic.getByRole('link', { name: /是否解散：總統依法決定/ }).click();
  await page.locator('#confidence-dissolution > summary').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#confidence-dissolution')).toHaveAttribute('open', '');
  await expect(page.locator('#confidence-dissolution')).toContainText('不是必須取得立法院長同意');
  await expect(page.locator('#confidence-dissolution')).toContainText('不是先等院長用完10日');
  await expect(page.locator('#confidence-dissolution')).toContainText('戒嚴或緊急命令生效期間');
  await page.locator('#confidence-actors > summary').click();
  await expect(page.locator('#confidence-actors')).toContainText('提案至少38人連署');
  await expect(page.locator('#confidence-actors')).toContainText('表決至少57票贊成');
  await page.locator('#confidence-failure > summary').click();
  await expect(page.locator('#confidence-failure')).toContainText('一年內不得對同一行政院長');
  await page.locator('#confidence-local > summary').click();
  await expect(page.locator('#confidence-local')).toContainText('沒有中央式的不信任案權力');
  await expect(page.locator('#confidence-local')).toContainText('議會不會因此一併解散');
  await expect(topic.locator('.source-disclosure[open]')).toHaveCount(0);
  await topic.locator('.section-return').click();
  await expect(nav.getByRole('heading')).toBeInViewport();
  const lastLink = nav.getByRole('link').last();
  await expect(lastLink).toHaveAttribute('href', '#government-all-roles');
});

test('倒閣到整屆改選的全文無JS可讀，包含官方依據與靜態SEO', async ({
  browser,
  baseURL,
  request,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(baseURL + 'government/');
    for (const chapter of data.topic.chapters) {
      await page.locator(`#${chapter.id} > summary`).click();
      await expect(page.locator(`#${chapter.id} > .more-chapter-body`)).toBeVisible();
    }
    await expect(page.locator('#confidence-vote')).toContainText('釋字第735號');
    await expect(page.locator('#confidence-election')).toContainText(
      '從總統宣告解散立法院之日起60日內',
    );
    await expect(page.locator('#confidence-election')).toContainText(
      '不分區與僑居國外國民立委34席',
    );
    await expect(page.locator('#confidence-new-legislature')).toContainText(
      '公告後第三日起報到，第十日開議',
    );
    await expect(page.locator('#confidence-new-legislature')).toContainText('任期依憲法為4年');
    await expect(page.locator('#confidence-transition')).toContainText(
      '3日內自行集會，開議7日內追認',
    );
    await page.locator('#confidence-vote .more-sources > summary').click();
    await expect(
      page.locator('#confidence-vote .source-item a').filter({ hasText: '釋字第735號' }),
    ).toHaveAttribute('href', 'https://www.president.gov.tw/Page/294/44611');
    const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').innerText());
    expect(schema.about).toContain('解散立法院與國會重選');
    expect(schema.citation).toContain('https://www.president.gov.tw/Page/95');
    expect(schema.dateModified).toBe(data.checkedAt);
    const response = await request.get(baseURL + 'government/');
    const html = await response.text();
    expect(html).toContain('id="confidence-local"');
    expect(html).toContain('倒閣到國會重選');
  } finally {
    await context.close();
  }
});

test('完整倒閣說明在手機大字與深淺色可閱讀，無水平溢出及無障礙違規', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('government/');
  for (const theme of ['light', 'dark']) {
    await page.evaluate((value) => localStorage.setItem('fc-color-theme', value), theme);
    await page.reload();
    await page.evaluate(() => {
      document
        .querySelectorAll<HTMLDetailsElement>('#cabinet-confidence details')
        .forEach((element) => {
          element.open = true;
        });
      document.documentElement.style.fontSize = '20px';
    });
    for (const width of [320, 390, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${theme} ${width}`,
      ).toBe(true);
    }
    const result = await new AxeBuilder({ page })
      .include('#cabinet-confidence')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(
      result.violations.map((item) => ({
        id: item.id,
        targets: item.nodes.map((node) => node.target),
      })),
    ).toEqual([]);
  }
});
