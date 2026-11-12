import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir } from 'node:fs/promises';
import topics from '../../Data/supplementary-topics.json';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('fc-consent', 'rejected'));
  await page.route(
    /^https:\/\/([^/]+\.)?(googletagmanager\.com|google-analytics\.com)\//,
    (route) => route.abort(),
  );
});

test('看更多從主導覽進入，主題跳轉與鍵盤收合可用，選票指南移除長篇比較', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('./');
  await page
    .getByRole('navigation', { name: '主要導覽' })
    .getByRole('link', { name: '看更多', exact: true })
    .click();
  await expect(page).toHaveURL(/\/more\/$/);
  await expect(
    page
      .getByRole('navigation', { name: '主要導覽' })
      .getByRole('link', { name: '看更多', exact: true }),
  ).toHaveAttribute('aria-current', 'page');
  await page
    .getByRole('navigation', { name: '補充主題' })
    .getByRole('link', { name: /政治攻防/ })
    .click();
  await expect(page.locator('#political-debate-title')).toBeInViewport();
  const summary = page.locator('#debate-examples > summary');
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#debate-examples')).toHaveAttribute('open', '');
  await expect(page.locator('#debate-examples .more-chapter-body')).toContainText('學校冷氣');
  await page.keyboard.press('Enter');
  await expect(page.locator('#debate-examples')).not.toHaveAttribute('open');
  await page.locator('#debate-misleading-tactics > summary').click();
  const tactic = page.locator('#tactic-half-truth > summary');
  await tactic.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#tactic-half-truth')).toHaveAttribute('open', '');
  await expect(page.locator('#tactic-half-truth > div')).toContainText('每位符合資格者');
  await expect(page.locator('#tactic-half-truth > div')).toContainText('補回另一半');
  await page
    .getByRole('navigation', { name: '補充主題' })
    .getByRole('link', { name: /憲法法庭/ })
    .click();
  await expect(page.locator('#constitutional-court-title')).toBeInViewport();
  await page.locator('#court-legislature > summary').click();
  await expect(page.locator('#court-legislature .more-chapter-body')).toContainText('四分之一');
  await page.goto('my-ballots/');
  await expect(page.locator('#indigenous-guide')).toHaveCount(0);
  await page.getByRole('link', { name: '到「看更多」了解原住民選舉差異' }).click();
  await expect(page).toHaveURL(/\/more\/#indigenous-guide$/);
  await expect(page.locator('#indigenous-guide-title')).toBeInViewport();
  expect(errors).toEqual([]);
});

test('看更多無JS可讀全部小節及依據，靜態SEO與sitemap收錄新頁', async ({
  browser,
  baseURL,
  request,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(baseURL + 'more/');
    for (const topic of topics.topics) {
      for (const chapter of topic.chapters) {
        await page.locator(`#${chapter.id} > summary`).click();
        await expect(page.locator(`#${chapter.id} .more-chapter-body`)).toBeVisible();
      }
    }
    await expect(page.locator('#constitutional-court .more-notice')).toContainText(
      '2025年12月19日',
    );
    await expect(page.locator('#constitutional-court .more-notice')).toContainText(
      '2026年的憲法判決',
    );
    await expect(page.locator('#court-urgent')).toContainText('六個月');
    await expect(page.locator('#court-still-running')).toContainText('不會一起停工');
    await expect(page.locator('#court-what-to-do')).toContainText('送達翌日起六個月');
    await expect(page.locator('#court-survivors')).toContainText('甲等11位');
    await expect(page.locator('#court-survivors')).toContainText('2026年8月14日');
    await expect(page.locator('#court-survivors')).toContainText('發回不是有罪判決');
    await expect(page.locator('#court-access-boundaries')).toContainText(
      '不是所有人都能自動要求重開案件',
    );
    const tactics = topics.topics.flatMap((topic) =>
      topic.chapters.flatMap((chapter) => ('tactics' in chapter ? (chapter.tactics ?? []) : [])),
    );
    for (const tactic of tactics) {
      await page.locator(`#${tactic.id} > summary`).click();
      await expect(page.locator(`#${tactic.id} > div`)).toContainText('可以怎麼核對');
    }
    await expect(page.locator('#tactic-fabricated-quote')).toContainText('尚未證實');
    await page.locator('#court-survivors > .more-chapter-body > .more-sources > summary').click();
    await expect(page.locator('#court-survivors .source-item a').first()).toHaveAttribute(
      'href',
      'https://www.judicial.gov.tw/tw/cp-1887-1599834-2a082-1.html',
    );
    await page.locator('#court-people .more-sources > summary').click();
    await expect(page.locator('#court-people .source-item a').first()).toHaveAttribute(
      'href',
      'https://cons.judicial.gov.tw/docdata.aspx?fid=22',
    );
    const canonicalBase = process.env.TEST_CANONICAL_ORIGIN
      ? process.env.TEST_CANONICAL_ORIGIN + (process.env.NEXT_PUBLIC_BASE_PATH ?? '') + '/'
      : baseURL;
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      canonicalBase + 'more/',
    );
    const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').innerText());
    expect(schema['@type']).toBe('LearningResource');
    expect(schema.citation).toContain('https://cons.judicial.gov.tw/docdata.aspx?fid=97&id=355485');
    expect(await (await request.get(baseURL + 'sitemap.xml')).text()).toContain(
      canonicalBase + 'more/',
    );
  } finally {
    await context.close();
  }
});

test('補充內容深淺色、手機放大字體與桌機可閱讀，所有展開內容通過無障礙檢查', async ({ page }) => {
  test.setTimeout(90000);
  await page.goto('more/');
  for (const theme of ['light', 'dark']) {
    await page.evaluate((value) => localStorage.setItem('fc-color-theme', value), theme);
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await page.evaluate(() => {
      document.querySelectorAll<HTMLDetailsElement>('.more-content details').forEach((element) => {
        element.open = true;
      });
    });
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(
      result.violations.map((item) => ({
        id: item.id,
        nodes: item.nodes.map((node) => ({ target: node.target, summary: node.failureSummary })),
      })),
    ).toEqual([]);
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '20px';
      });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${theme}: ${width}px`,
      ).toBe(true);
    }
    const toggle = page.getByRole('button', { name: '開啟導覽', exact: true });
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(
      page
        .getByRole('navigation', { name: '主要導覽' })
        .getByRole('link', { name: '看更多', exact: true }),
    ).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(toggle).toBeFocused();
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '';
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await page
      .getByRole('navigation', { name: '補充主題' })
      .getByRole('link', { name: /憲法法庭/ })
      .click();
    await page.locator('#court-survivors > summary').click();
    await mkdir('.qa', { recursive: true });
    await page.screenshot({ path: `.qa/more-mobile-${theme}.png` });
  }
});
