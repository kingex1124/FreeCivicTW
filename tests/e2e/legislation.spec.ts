import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir } from 'node:fs/promises';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('fc-consent', 'rejected'));
  await page.route(
    /^https:\/\/([^/]+\.)?(googletagmanager\.com|google-analytics\.com)\//,
    (route) => route.abort(),
  );
});

test('政府導覽從機關總覽才開始，跳轉保留上方選擇並可進入中央地方完整立法', async ({ page }) => {
  await page.goto('government/');
  await page.getByRole('button', { name: '地方政府', exact: true }).click();
  expect(
    await page.evaluate(() => {
      const workspace = document.querySelector('.government-workspace')!;
      const reading = document.querySelector('.government-reading-layout')!;
      return (
        !reading.contains(workspace) &&
        Boolean(workspace.compareDocumentPosition(reading) & Node.DOCUMENT_POSITION_FOLLOWING)
      );
    }),
  ).toBe(true);
  const nav = page.getByRole('navigation', { name: '政府內容導覽' });
  await expect(nav.getByRole('link')).toHaveCount(11);
  await nav.getByRole('link', { name: /人事任命/ }).click();
  await expect(page.locator('#appointments-title')).toBeInViewport();
  await expect(page.getByRole('button', { name: '地方政府', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await nav.getByRole('link', { name: /立法院立法/ }).click();
  await expect(page).toHaveURL(/\/government\/#national-legislation$/);
  await expect(page.locator('#national-legislation-title')).toBeInViewport();
  await expect(page.getByRole('button', { name: '地方政府', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.locator('.government-legislation-links a').first()).toHaveAttribute(
    'href',
    '#national-legislation',
  );
  const national = page.locator('#national-legislation');
  await national
    .getByRole('navigation', { name: '立法院立法流程捷徑' })
    .getByRole('link', { name: /行政院覆議分支/ })
    .click();
  await page.locator('#national-reconsideration > summary').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#national-reconsideration')).toHaveAttribute('open', '');
  await expect(page.locator('#national-reconsideration')).toContainText('全體立委二分之一以上');
  await national.getByRole('link', { name: '比較地方議會的立法程序', exact: true }).click();
  await expect(page).toHaveURL(/\/government\/#local-legislation$/);
  await expect(page.locator('#local-legislation-title')).toBeInViewport();
  await page.locator('#local-reconsideration > summary').click();
  await expect(page.locator('#local-reconsideration')).toContainText('出席議員三分之二');
  await page.locator('#local-promulgation > summary').click();
  await expect(page.locator('#local-promulgation')).toContainText('核定文送達');
  const local = page.locator('#local-legislation');
  await expect(page.locator('.government-reading-content .section-return:visible')).toHaveCount(0);
  const comparisonLink = local.getByRole('link', { name: '比較立法院的立法程序', exact: true });
  await page.mouse.move(0, 0);
  await comparisonLink.scrollIntoViewIfNeeded();
  const linkOffset = () =>
    comparisonLink.evaluate((link) => {
      const rect = link.getBoundingClientRect();
      const parent = link.parentElement!.getBoundingClientRect();
      return { top: rect.top - parent.top, left: rect.left - parent.left };
    });
  const beforeHover = await linkOffset();
  // Hovering a nearby link must not reflow the footer and move another link.
  await local.getByRole('link', { name: '回政府頁的完整立法入口', exact: true }).hover();
  expect(await linkOffset()).toEqual(beforeHover);
});

test('杯葛、立法角色、公布生效和憲法分支無JS完整可讀並有官方來源', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(baseURL + 'more/');
    await expect(page.locator('#national-legislation, #local-legislation')).toHaveCount(0);
    await expect(page.getByRole('navigation', { name: '補充主題' }).getByRole('link')).toHaveCount(
      3,
    );
    const moreSchema = JSON.parse(
      await page.locator('script[type="application/ld+json"]').innerText(),
    );
    expect(moreSchema.about).not.toContain('立法院立法程序');
    await page.locator('#debate-boycott > summary').click();
    await expect(page.locator('#debate-boycott')).toContainText('不是一個單獨的法定程序');
    await page.goto(baseURL + 'government/');
    for (const id of [
      'national-speaker',
      'national-agenda',
      'national-committee',
      'national-promulgation',
      'national-constitutional-review',
      'local-speaker',
      'local-committee',
      'local-implementation',
      'local-constitutional-review',
    ]) {
      await page.locator(`#${id} > summary`).click();
      await expect(page.locator(`#${id} > .more-chapter-body`)).toBeVisible();
    }
    await expect(page.locator('#national-agenda')).toContainText('委員19人');
    await expect(page.locator('#national-committee')).toContainText('13至15席');
    await expect(page.locator('#national-promulgation')).toContainText('收到的時間');
    await expect(page.locator('#national-promulgation')).toContainText('1日公布');
    await expect(page.locator('#national-constitutional-review')).toContainText(
      '送件不會自動凍結法律',
    );
    await expect(page.locator('#local-constitutional-review')).toContainText('第83條');
    await expect(page.locator('#local-speaker')).toContainText('高雄設9位');
    await expect(page.locator('#local-committee')).toContainText('法規委員會另有9人');
    await page.locator('#national-first-reading > summary').click();
    await page
      .locator('#national-first-reading > .more-chapter-body > .more-sources > summary')
      .click();
    await expect(
      page
        .locator('#national-first-reading .source-item a')
        .filter({ hasText: '立法院：立法程序' }),
    ).toHaveAttribute('href', 'https://www.ly.gov.tw/Pages/List.aspx?nodeid=151');
    const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').innerText());
    expect(schema.about).toContain('立法院立法程序');
    expect(schema.about).toContain('地方議會立法程序');
    expect(schema.citation).toContain('https://www.ly.gov.tw/Pages/List.aspx?nodeid=151');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', schema.url);
  } finally {
    await context.close();
  }
});

test('政府閱讀區在手機大字、短視窗與深淺色可使用，無水平溢出且符合無障礙', async ({ page }) => {
  test.setTimeout(90000);
  await page.goto('government/');
  for (const theme of ['light', 'dark']) {
    await page.evaluate((value) => localStorage.setItem('fc-color-theme', value), theme);
    await page.reload();
    await page.evaluate(() => {
      document
        .querySelectorAll<HTMLDetailsElement>('#government-legislation details')
        .forEach((element) => {
          element.open = true;
        });
    });
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: width === 1440 ? 600 : 900 });
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '20px';
      });
      const nav = page.getByRole('navigation', { name: '政府內容導覽' });
      await nav.getByRole('link', { name: /所有角色/ }).click();
      await expect(page.locator('#government-all-roles > summary')).toBeInViewport();
      await nav.getByRole('link', { name: /機關職責/ }).click();
      await expect(page.locator('#agency-directory-title')).toBeInViewport();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${theme} ${width}`,
      ).toBe(true);
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '';
    });
    const result = await new AxeBuilder({ page })
      .include('.government-reading-layout')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(
      result.violations.map((item) => ({
        id: item.id,
        nodes: item.nodes.map((node) => ({ target: node.target, summary: node.failureSummary })),
      })),
    ).toEqual([]);
    await page
      .locator('#agency-directory-title')
      .evaluate((el) => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
    await mkdir('.qa', { recursive: true });
    await page.screenshot({ path: `.qa/government-reading-${theme}.png` });
  }
});
