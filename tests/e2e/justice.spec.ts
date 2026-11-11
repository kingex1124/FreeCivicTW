import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir } from 'node:fs/promises';
import justice from '../../Data/justice-system.json';

test.beforeEach(async ({ page }) => {
  await page.route(
    /^https:\/\/([^/]+\.)?(googletagmanager\.com|google-analytics\.com|analytics\.google\.com)\//,
    (route) => route.abort(),
  );
  await page.addInitScript(() => localStorage.setItem('fc-consent', 'rejected'));
});

test('司法頁能從政府頁籤進入，機關分類、搜尋、選擇與無結果可操作', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('government/');
  await page.locator('.scope-switch').getByRole('link', { name: '司法與警檢' }).click();
  await expect(page).toHaveURL(/\/justice\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('誰來調查');
  await expect(
    page.getByRole('navigation', { name: '主要導覽' }).getByRole('link', { name: '司法與警檢' }),
  ).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.justice-entity-card')).toHaveCount(justice.entities.length);
  await page.getByRole('button', { name: '查看檢察官', exact: true }).click();
  await expect(page.locator('.justice-inspector > h3')).toHaveText('檢察官');
  await expect(page.locator('.justice-inspector')).toContainText('不能自行裁定羈押');
  const filters = page.getByRole('group', { name: '司法機關分類' });
  await filters.getByRole('button', { name: '警察與調查' }).click();
  await expect(page.locator('.justice-entity-card')).toHaveCount(
    justice.entities.filter((entity) => entity.group === 'police').length,
  );
  await page.getByRole('button', { name: '查看司法警察（官）', exact: true }).click();
  await expect(page.locator('.justice-inspector')).toContainText('依法立即開始調查');
  await page
    .getByRole('searchbox', { name: '搜尋司法機關、角色與工作' })
    .fill('沒有這個司法單位xyz');
  await expect(page.locator('.justice-entity-card')).toHaveCount(0);
  await expect(page.locator('.justice-empty')).toBeVisible();
  await expect(page.locator('.justice-inspector > h3')).toHaveText('換個關鍵字試試看');
  await page.getByRole('button', { name: '清除條件', exact: true }).click();
  await expect(page.locator('.justice-entity-card')).toHaveCount(justice.entities.length);
  await page.getByRole('button', { name: '認識檢察與偵查' }).click();
  await expect(filters.getByRole('button', { name: '檢察與偵查' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.locator('.justice-inspector > h3')).toHaveText('法務部');
  expect(errors).toEqual([]);
});

test('司法公訴流程可逐步、跳步與重來，保留不起訴分支及申告的程序界線', async ({ page }) => {
  await page.goto('justice/');
  const process = page.locator('#justice-process');
  await expect(process.getByRole('button', { name: '上一步', exact: true })).toBeDisabled();
  await process.getByRole('button', { name: '下一步', exact: true }).click();
  await expect(page.locator('.justice-current-step > h3')).toHaveText('依法調查與偵查');
  await expect(page.locator('.justice-current-step')).toContainText('法院審查裁定');
  await process.getByRole('button', { name: '下一步', exact: true }).click();
  await expect(page.locator('.justice-outcomes article')).toHaveCount(4);
  await expect(page.locator('.justice-outcomes')).toContainText('不起訴');
  await expect(page.locator('.justice-outcomes')).toContainText('緩起訴');
  await page.locator('.justice-flow-progress button').last().click();
  await expect(process.getByRole('button', { name: '下一步', exact: true })).toBeDisabled();
  await process.getByRole('button', { name: '重來', exact: true }).click();
  await expect(page.locator('.justice-current-step > h3')).toHaveText('報案或提出告訴、告發');
  await page.locator('.justice-full-flow > summary').click();
  await expect(page.locator('.justice-full-flow > ol > li')).toHaveCount(
    justice.criminalFlow.steps.length,
  );
  await expect(page.locator('.justice-reporting-channels > article')).toHaveCount(2);
  await expect(page.locator('.justice-reporting-channels')).toContainText('不必先寫好告訴狀');
  await expect(page.locator('.justice-reporting-channels')).toContainText('受（處）理案件證明單');
  const faq = page.locator('.justice-faq > details').filter({
    has: page.locator('summary').getByText('不起訴，和法院判無罪一樣嗎？', { exact: true }),
  });
  await faq.locator(':scope > summary').click();
  await expect(faq).toContainText('聲請准許提起自訴');
});

test('司法頁手機選機關帶到說明，鍵盤、無障礙與不同螢幕寬度正常', async ({ page }) => {
  for (const width of [360, 390, 900, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('justice/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (width === 360) {
      await page.getByRole('button', { name: '開啟導覽' }).click();
      await expect(
        page
          .getByRole('navigation', { name: '主要導覽' })
          .getByRole('link', { name: '司法與警檢' }),
      ).toBeVisible();
      await page.getByRole('button', { name: '關閉導覽' }).click();
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const button = page.getByRole('button', { name: '查看律師與法律扶助', exact: true });
  await button.focus();
  await button.press('Enter');
  await expect(page.locator('.justice-inspector > h3')).toHaveText('律師與法律扶助');
  await expect(page.locator('.justice-inspector > h3')).toBeInViewport();
  await expect(page.locator('.justice-inspector')).toContainText('財團法人');
  await page.getByRole('button', { name: '回到機關與角色選擇' }).click();
  await expect(page.getByRole('searchbox', { name: '搜尋司法機關、角色與工作' })).toBeFocused();
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(
    results.violations.map((item) => ({
      id: item.id,
      targets: item.nodes.map((node) => node.target),
    })),
  ).toEqual([]);
  await mkdir('.qa', { recursive: true });
  await page.screenshot({ path: '.qa/justice-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('justice/');
  await page.screenshot({ path: '.qa/justice-desktop.png', fullPage: true });
});

test('司法完整內容不依賴JavaScript，含靜態metadata、引用與sitemap', async ({
  browser,
  baseURL,
  request,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(baseURL + 'justice/');
    await page.locator('.justice-full-text > summary').click();
    await expect(page.locator('.justice-full-text > section')).toHaveCount(justice.entities.length);
    await expect(page.locator('#justice-full-prosecutors')).toContainText('客觀義務');
    await page.locator('.justice-full-flow > summary').click();
    await expect(page.locator('.justice-full-flow > ol > li')).toHaveCount(
      justice.criminalFlow.steps.length,
    );
    await expect(page.locator('.justice-full-flow')).toContainText('緩起訴');
    const canonicalBase = process.env.TEST_CANONICAL_ORIGIN
      ? process.env.TEST_CANONICAL_ORIGIN + (process.env.NEXT_PUBLIC_BASE_PATH ?? '') + '/'
      : baseURL;
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      canonicalBase + 'justice/',
    );
    const structured = JSON.parse(
      await page.locator('script[type="application/ld+json"]').innerText(),
    );
    expect(structured['@type']).toBe('LearningResource');
    expect(structured.citation.length).toBeGreaterThan(10);
    expect(await (await request.get(baseURL + 'sitemap.xml')).text()).toContain(
      canonicalBase + 'justice/',
    );
  } finally {
    await context.close();
  }
});
