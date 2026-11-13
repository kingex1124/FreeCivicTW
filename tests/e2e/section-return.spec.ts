import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route(
    /^https:\/\/([^/]+\.)?(googletagmanager\.com|google-analytics\.com|analytics\.google\.com)\//,
    (route) => route.abort(),
  );
});

test('政府角色筆記及各段落可回到手機目錄，選擇保留', async ({ page }) => {
  test.setTimeout(90000);
  await page.goto('government/');
  await page.getByRole('button', { name: '地方政府', exact: true }).click();
  await page.getByRole('button', { name: /一般區長/ }).click();
  await expect(page.locator('.role-inspector > h2')).toHaveText('一般區長');
  await page.locator('.role-inspector .section-return').click();
  await expect(page.locator('#government-agency-picker')).toBeInViewport();
  await page.locator('.agency-picker-trigger').click();
  await page.locator('.agency-picker-options').getByRole('button', { name: /^交通局/ }).click();
  await expect(page.locator('.role-inspector > h2')).toHaveText('交通局');
  await page.locator('.role-inspector .section-return').click();
  await expect(page.locator('#government-agency-picker')).toBeInViewport();
  await expect(page.locator('#agency-picker-dialog')).not.toBeVisible();
  const nav = page.getByRole('navigation', { name: '政府內容導覽' });
  const entries = [
    ['機關職責', '#agency-directory + .section-return'],
    ['制度流程', '#government-procedures > .section-return'],
    ['立法院立法', '#national-legislation .section-return'],
    ['議會立法', '#local-legislation .section-return'],
    ['人事任命', '#appointments > .section-return'],
    ['質詢與備詢', '#questioning > .section-return'],
    ['政風與監督', '#integrity > .section-return'],
    ['生活情境', '#government-situations > .section-return'],
    ['所有角色', '#government-all-roles + .section-return'],
  ];
  for (const [name, selector] of entries) {
    await nav.getByRole('link', { name: new RegExp(name) }).click();
    await page.locator(selector).click();
    await expect(nav.getByRole('heading')).toBeInViewport();
  }
  await expect(page.getByRole('button', { name: '地方政府', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('司法目錄從審判路徑開始，完整機關說明在最後，手機可返回', async ({ page }) => {
  test.setTimeout(90000);
  await page.goto('justice/');
  const nav = page.getByRole('navigation', { name: '司法內容導覽' });
  await expect(nav.getByRole('link')).toHaveCount(6);
  expect(
    await page.evaluate(() => {
      const directory = document.querySelector('#justice-directory')!;
      const layout = document.querySelector('.justice-reading-layout')!;
      return (
        !layout.contains(directory) &&
        Boolean(directory.compareDocumentPosition(layout) & Node.DOCUMENT_POSITION_FOLLOWING)
      );
    }),
  ).toBe(true);
  for (const [name, selector] of [
    ['審判路徑', '#justice-courts > .section-return'],
    ['刑事程序', '#justice-process > .section-return'],
    ['羈押、交保與抗告', '#justice-custody > .section-return'],
    ['報案與申告', '#justice-reporting > .section-return'],
    ['常見疑問', '#justice-faq > .section-return'],
    ['完整機關與角色', '#justice-full-text + .section-return'],
  ]) {
    await nav.getByRole('link', { name: new RegExp(name) }).click();
    await page.locator(selector).click();
    await expect(nav.getByRole('heading')).toBeInViewport();
  }
  await page.locator('#justice-full-text > summary').click();
  await expect(page.locator('#justice-full-text > section')).toHaveCount(25);
  expect(
    await page
      .locator('#justice-full-text')
      .evaluate((el) => Boolean(el.previousElementSibling?.id === 'justice-faq')),
  ).toBe(true);
});

test('看更多三個主題都能返回目錄，無 JavaScript 也可使用', async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  try {
    const page = await context.newPage();
    await page.goto(baseURL + 'more/');
    const nav = page.getByRole('navigation', { name: '補充主題' });
    for (const [name, selector] of [
      ['原住民選舉', '.more-content > .more-next-links .section-return'],
      ['政治攻防', '#political-debate .section-return'],
      ['憲法法庭', '#constitutional-court .section-return'],
    ]) {
      await nav.getByRole('link', { name: new RegExp(name) }).click();
      await page.locator(selector).click();
      await expect(nav.getByRole('heading')).toBeInViewport();
    }
  } finally {
    await context.close();
  }
});
