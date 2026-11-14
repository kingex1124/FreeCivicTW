import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import data from '../../Data/civic-participation.json';

test.beforeEach(async ({ page }) => {
  await page.route(
    /^https:\/\/([^/]+\.)?(googletagmanager\.com|google-analytics\.com|analytics\.google\.com)\//,
    (route) => route.abort(),
  );
});

test('政府頁公投與罷免可從目錄跳轉、鍵盤展開並回到目錄', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('government/');
  const nav = page.getByRole('navigation', { name: '政府內容導覽' });
  await nav.getByRole('link', { name: /^公投/ }).click();
  await expect(page.locator('#referendum-title')).toBeInViewport();
  await page.locator('#referendum-local-process > summary').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#referendum-local-process')).toHaveAttribute('open', '');
  await expect(page.locator('#referendum-local-process')).toContainText('臺北市');
  await expect(page.locator('#referendum-local-process')).toContainText('2.5%');
  await page.locator('#referendum .section-return').click();
  await expect(nav.getByRole('heading')).toBeInViewport();
  await nav.getByRole('link', { name: /^罷免/ }).click();
  await expect(page.locator('#recall-title')).toBeInViewport();
  await page.locator('#recall-president > summary').click();
  await expect(page.locator('#recall-president')).toContainText('全體立委三分之二');
  await expect(page.locator('#recall-president')).toContainText('選舉人總額過半數投票');
  await page.locator('#recall .section-return').click();
  await expect(nav.getByRole('heading')).toBeInViewport();
});

test('公投罷免無JS完整可讀、附官方來源並由政府頁提供SEO', async ({ browser, baseURL, request }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(baseURL + 'government/');
    for (const topic of data.topics)
      for (const chapter of topic.chapters) {
        await page.locator(`#${chapter.id} > summary`).click();
        await expect(page.locator(`#${chapter.id} > .more-chapter-body`)).toBeVisible();
      }
    await expect(page.locator('#referendum-vote')).toContainText('三個月起至六個月');
    await expect(page.locator('#referendum-vote')).toContainText('24,999');
    await expect(page.locator('#referendum-eligibility')).toContainText('18歲');
    await expect(page.locator('#recall-eligibility')).toContainText('20歲');
    await expect(page.locator('#recall-offices')).toContainText('不分區');
    await expect(page.locator('#recall-signatures')).toContainText('提議人不得再當連署人');
    await expect(page.locator('#recall-signatures')).toContainText('正反面影本');
    await expect(page.locator('#recall-effects')).toContainText('自公告之日起解除職務');
    await page.locator('#referendum-vote .more-sources > summary').click();
    await expect(page.locator('#referendum-vote .source-item a').first()).toHaveAttribute(
      'href',
      'https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=D0020050',
    );
    const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').innerText());
    expect(schema.about).toContain('地方性公民投票');
    expect(schema.about).toContain('總統副總統罷免');
    expect(await (await request.get(baseURL + 'sitemap.xml')).text()).toContain('2026-11-14');
    await page.goto(baseURL + 'more/');
    await expect(page.locator('#referendum, #recall')).toHaveCount(0);
  } finally {
    await context.close();
  }
});

test('公投罷免在手機大字與深淺色完整展開可閱讀，符合無障礙', async ({ page }) => {
  test.setTimeout(90000);
  await page.goto('government/');
  for (const theme of ['light', 'dark']) {
    await page.evaluate((value) => localStorage.setItem('fc-color-theme', value), theme);
    await page.reload();
    await page.evaluate(() =>
      document
        .querySelectorAll<HTMLDetailsElement>('.participation-topics details')
        .forEach((el) => {
          el.open = true;
        }),
    );
    for (const width of [320, 390, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '20px';
      });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${theme} ${width}`,
      ).toBe(true);
    }
    const result = await new AxeBuilder({ page })
      .include('.participation-topics')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(
      result.violations.map((item) => ({
        id: item.id,
        nodes: item.nodes.map((node) => ({ target: node.target, summary: node.failureSummary })),
      })),
    ).toEqual([]);
  }
});
