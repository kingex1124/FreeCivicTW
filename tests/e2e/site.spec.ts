import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, readFile } from 'node:fs/promises';
import sourceData from '../../Data/sources.json';
import civicData from '../../Data/civic-roles.json';
import agencyData from '../../Data/government-agencies.json';

test.beforeEach(async ({ page }) => {
  // 即使驗證正式建置，也不將自動化測試流量送到 Google。
  await page.route(
    /^https:\/\/([^/]+\.)?(googletagmanager\.com|google-analytics\.com|analytics\.google\.com)\//,
    (route) => route.abort(),
  );
});

test('首頁可閱讀並連到三條路徑，沒有瀏覽器執行錯誤', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('其實離你');
  await page.getByRole('button', { name: '02誰負責監督？' }).click();
  await expect(page.locator('.preview-caption')).toContainText('民意代表審議與監督');
  await expect(page.locator('.path-card')).toHaveCount(3);
  await page.locator('.path-vote').click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('我的一張票');
  expect(errors).toEqual([]);
});

test('首頁人民與房子卡片能展開說明、切換與收起，手機及鍵盤可操作', async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('./');
    const people = page.getByRole('button', { name: /我們，每一個人/ });
    const executive = page.getByRole('button', { name: /行政團隊.*把事情做好/ });
    const representative = page.getByRole('button', { name: /民意代表.*把權力看好/ });
    const details = page.getByRole('region', { name: '誰負責把事情做好？' });
    await expect(page.locator('#preview-role-details')).toBeHidden();
    await people.focus();
    await people.press('Enter');
    const participation = page.getByRole('region', { name: '我們可以怎麼參與？' });
    await expect(participation).toBeVisible();
    await expect(participation.getByRole('heading', { level: 2 })).toBeInViewport();
    await expect(people).toHaveAttribute('aria-expanded', 'true');
    await expect(participation).toContainText('中央與地方');
    await expect(participation.locator('.preview-participation-actions li')).toHaveText(
      civicData.roles.find((role) => role.id === 'people')!.powers.slice(0, 5),
    );
    const participationAccessibility = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(participationAccessibility.violations.map((v) => v.id)).toEqual([]);
    await mkdir('.qa', { recursive: true });
    await participation.screenshot({ path: `.qa/home-participation-${width}.png` });
    await page.getByRole('button', { name: '收起分工說明' }).click();
    await expect(page.locator('#preview-role-details')).toBeHidden();
    await expect(people).toBeFocused();
    await people.press('Space');
    await expect(participation).toBeVisible();
    await executive.click();
    await expect(people).toHaveAttribute('aria-expanded', 'false');
    await expect(executive).toHaveAttribute('aria-expanded', 'true');
    await expect(details).toBeVisible();
    await expect(details.getByRole('heading', { level: 3 })).toHaveText([
      '各部部長',
      '直轄市長／縣長／市長',
    ]);
    await expect(details).toContainText('中央');
    await expect(details).toContainText('地方');
    await representative.focus();
    await representative.press('Enter');
    const oversight = page.getByRole('region', { name: '誰負責把權力看好？' });
    await expect(oversight).toBeVisible();
    await expect(oversight.getByRole('heading', { level: 3 })).toHaveText([
      '立法委員',
      '直轄市議員／縣市議員',
    ]);
    await expect(executive).toHaveAttribute('aria-expanded', 'false');
    await expect(representative).toHaveAttribute('aria-expanded', 'true');
    await page.getByRole('button', { name: '收起分工說明' }).click();
    await expect(page.locator('#preview-role-details')).toBeHidden();
    await expect(representative).toBeFocused();
    await representative.press('Space');
    await expect(oversight).toBeVisible();
    await page.getByRole('button', { name: '01誰負責做事？' }).click();
    await expect(details).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(
      results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
    ).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await details.getByRole('link', { name: '打開完整政府關係圖' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('把角色連起來');
    await page.goto('./');
    await people.click();
    await participation.getByRole('link', { name: '除了投票，我還可以做什麼？' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('除了投票，我還可以做什麼');
  }
});

test('分析SDK自動載入並保護查詢情境，不重複初始化', async ({ page }) => {
  test.skip(process.env.TEST_ANALYTICS !== 'true', '僅使用假 ID 與攔截請求驗證，不送到真實 GA。');
  const requests: string[] = [];
  await page.addInitScript(() => localStorage.setItem('fc-consent', 'rejected'));
  await page.route('https://www.googletagmanager.com/**', async (route) => {
    requests.push(route.request().url());
    await route.fulfill({ contentType: 'application/javascript', body: '/* isolated test SDK */' });
  });
  await page.route('**/*google-analytics.com/**', (route) => route.abort());
  await page.goto('./');
  await expect(page.locator('.consent-panel')).toHaveCount(0);
  await expect.poll(() => requests.length).toBe(1);
  expect(requests[0]).toBe('https://www.googletagmanager.com/gtm.js?id=GTM-TEST00001');
  await page
    .getByRole('navigation', { name: '主要導覽' })
    .getByRole('link', { name: '我的選票指南' })
    .click();
  await page.getByRole('button', { name: '先看頭份市範例' }).click();
  await page.getByLabel('選舉身分教學情境').selectOption('mountain');
  expect(
    await page.evaluate(() =>
      (window.dataLayer ?? []).every(
        (command) => Object.prototype.toString.call(command) === '[object Arguments]',
      ),
    ),
  ).toBe(true);
  const commands = await page.evaluate(() =>
    (window.dataLayer ?? []).map((item) => Array.from(item as Iterable<unknown>)),
  );
  expect(
    commands.some((command) => command[0] === 'event' && command[1] === 'ballot_lookup_complete'),
  ).toBe(true);
  expect(JSON.stringify(commands)).not.toContain('苗栗');
  expect(JSON.stringify(commands)).not.toContain('mountain');
  expect(commands.filter((command) => command[0] === 'js')).toHaveLength(1);
  expect(commands.filter((command) => command[0] === 'config')).toHaveLength(0);
  expect(commands[0]).toEqual([
    'consent',
    'default',
    {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    },
  ]);
  await page.getByRole('link', { name: '隱私與使用統計', exact: true }).click();
  await expect(page.getByRole('heading', { name: '網站使用統計' })).toBeVisible();
  await expect(page.locator('.consent-panel')).toHaveCount(0);
  expect(requests).toHaveLength(1);
});

test('地區查詢、身分票別替換、清除與同名搜尋', async ({ page }) => {
  await page.goto('my-ballots/');
  await page.getByRole('button', { name: '先看頭份市範例' }).click();
  await expect(page.getByRole('heading', { name: '苗栗縣頭份市', exact: true })).toBeVisible();
  await expect(page.locator('.ballot-card')).toHaveCount(8);
  await expect(
    page.locator('.ballot-card strong').getByText('頭份市民代表', { exact: true }),
  ).toBeVisible();
  await page.getByLabel('選舉身分教學情境').selectOption('mountain');
  await expect(page.locator('.ballot-card')).toHaveCount(8);
  await expect(
    page.locator('.ballot-card strong').getByText('山地原住民立法委員', { exact: true }),
  ).toBeVisible();
  await page.locator('.ballot-card').nth(3).locator('summary').click();
  await expect(page.locator('.ballot-card').nth(3).getByText('有哪些界線')).toBeVisible();
  await page.getByRole('button', { name: '清除選擇' }).click();
  await expect(page.locator('.lookup-empty')).toBeVisible();
  await page.getByLabel('搜尋地名').fill('中正區');
  await expect(page.getByRole('button', { name: /臺北市中正區/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /基隆市中正區/ })).toBeVisible();
  await page.getByRole('button', { name: /臺北市中正區/ }).click();
  await page.getByRole('button', { name: '看看有哪些職務' }).click();
  await expect(page.locator('.ballot-card')).toHaveCount(6);
  await page.getByLabel('戶籍縣市', { exact: true }).selectOption({ label: '新北市' });
  await page.getByLabel('鄉鎮市區', { exact: true }).selectOption({ label: '烏來區' });
  await page.getByRole('button', { name: '看看有哪些職務' }).click();
  await expect(page.locator('.ballot-card')).toHaveCount(8);
  await expect(
    page.locator('.ballot-card strong').getByText('烏來區民代表', { exact: true }),
  ).toBeVisible();
  expect(page.url()).not.toContain('?');
});

test('政府角色、關係與分步預算可以操作', async ({ page }) => {
  await page.goto('government/');
  await page.getByRole('button', { name: /總統／副總統/ }).click();
  await expect(
    page.locator('.role-inspector').getByRole('heading', { name: '總統／副總統', exact: true }),
  ).toBeVisible();
  await page.getByLabel('選擇關係種類').selectOption('appointment');
  await expect(page.locator('.relation-list')).toContainText('任命行政院長');
  await expect(page.locator('.relation-list')).toContainText('依行政院長提請任命各部部長');
  await page.locator('.relation-offices summary').click();
  await expect(page.locator('.relation-offices .office-list li')).toHaveCount(15);
  await expect(page.locator('.relation-offices')).toContainText('數位發展部部長');
  await page.getByLabel('選擇關係種類').selectOption('consent');
  await expect(page.locator('.relation-list')).toContainText('提名大法官，須經立法院同意');
  await expect(page.locator('.relation-list')).toContainText('司法院大法官（含院長、副院長）');
  await page.getByRole('button', { name: /司法院與司法機關/ }).click();
  await expect(page.locator('.relation-list')).toContainText('審查並行使大法官人事同意權');
  await page.getByRole('button', { name: '地方政府', exact: true }).click();
  await page.getByRole('button', { name: /一般區長/ }).click();
  await expect(page.locator('.role-inspector')).toContainText('依法');
  await page.getByRole('button', { name: '預算從哪裡來，又由誰把關？' }).click();
  await page.getByRole('button', { name: '下一步', exact: true }).click();
  await expect(page.locator('.flow-current')).toContainText('審議與監督');
  await page.getByRole('button', { name: '直接閱讀全部步驟' }).click();
  await expect(page.locator('.full-flow li')).toHaveCount(4);
});

test('任命職務可展開，質詢對象與程序界線可閱讀', async ({ page }) => {
  await page.goto('government/');
  await page.getByRole('link', { name: '誰任命部長、局處長？' }).click();
  await expect(page.locator('#central-ministers .office-list li')).toHaveCount(15);
  await expect(page.locator('#central-ministers')).toContainText('數位發展部部長');
  await expect(page.locator('#central-ministers')).toContainText('運動部部長');
  await page.locator('#taipei-heads').getByText(/^查看 \d+ 項職務$/).click();
  await expect(page.locator('#taipei-heads .office-list')).toContainText('交通局局長');
  await page.locator('#miaoli-heads').getByText(/^查看 \d+ 項職務$/).click();
  await expect(page.locator('#miaoli-heads .office-list')).toContainText('交通工務處處長');
  await page.getByRole('link', { name: '誰質詢、誰備詢？' }).click();
  await expect(page.locator('.questioning-table tbody tr')).toHaveCount(4);
  await expect(page.locator('.questioning-table tbody tr').first()).toContainText('立法委員');
  await expect(page.locator('.questioning-table tbody tr').first()).toContainText('數位發展部長');
  await expect(page.locator('.questioning-notes')).toContainText('總統的國情報告');
});

test('地方局處與公所任用、選民服務及政風職掌可閱讀', async ({ page }) => {
  await page.goto('government/');
  await page.getByRole('button', { name: '地方政府', exact: true }).click();
  await page.getByLabel('選擇關係種類').selectOption('appointment');
  await expect(page.locator('.relation-list')).toContainText('地方局處首長');
  await page.locator('.relation-offices summary').filter({ hasText: '臺北市' }).click();
  await expect(page.locator('.relation-offices[open]')).toContainText('交通局局長');
  await expect(page.locator('.relation-offices[open]')).toContainText('市長依法任免');
  await expect(page.locator('.relation-offices[open]')).not.toContainText('總統任命');
  await page.getByRole('button', { name: /鄉長／鎮長／縣轄市長/ }).click();
  await expect(page.locator('.relation-list')).toContainText('公所一級單位主管');
  await page.getByRole('button', { name: /政風機構/ }).click();
  await expect(page.locator('.role-inspector')).toContainText('專屬人事規定');
  await expect(page.locator('.role-inspector')).toContainText('廉政倫理諮詢');
  await page.getByRole('button', { name: '中央政府', exact: true }).click();
  await page.getByRole('button', { name: /立法委員/ }).click();
  await expect(page.locator('.role-inspector')).toContainText('常見選民服務');
  await expect(page.locator('.role-inspector')).toContainText('轉介');
  await expect(page.locator('.role-inspector')).toContainText('不能保證申請通過');
  await page.getByRole('link', { name: '政風處、政風室在做什麼？' }).click();
  await expect(page.locator('#integrity')).toContainText('司法警察');
  await expect(
    page.locator('#integrity a').filter({ hasText: '前往廉政署官方檢舉說明' }),
  ).toHaveAttribute('href', 'https://www.aac.moj.gov.tw/6398/6624/6632/1181666/post');
  await page.goto('my-ballots/');
  await page.getByRole('button', { name: '先看頭份市範例' }).click();
  await page.getByLabel('選舉身分教學情境').selectOption('general');
  const card = page
    .locator('.ballot-card')
    .filter({ has: page.locator('strong').getByText('區域立法委員', { exact: true }) });
  await card.locator('summary').click();
  await expect(card).toContainText('常見選民服務');
});

test('中央地方角色區可展開個別機關，人民角色兩邊都有，點選後切換機關筆記', async ({ page }) => {
  await page.goto('government/');
  await expect(
    page.locator('.role-grid').getByRole('button', { name: /人民與公民參與/ }),
  ).toBeVisible();
  await page.locator('.agency-picker-trigger').click();
  await expect(page.locator('.agency-picker-options button')).toHaveCount(32);
  await page
    .locator('.agency-picker-options')
    .getByRole('button', { name: /^交通部/ })
    .click();
  await expect(page.locator('.role-inspector > h2')).toHaveText('交通部');
  await expect(page.locator('.agency-inspection')).toContainText('跟我們的生活有什麼關係');
  await expect(page.locator('.agency-inspection')).toContainText('氣象資訊');
  await page.getByLabel('搜尋可點選的單位').fill('教育部');
  await page
    .locator('.agency-picker-options')
    .getByRole('button', { name: /^教育部/ })
    .click();
  await expect(page.locator('.role-inspector > h2')).toHaveText('教育部');
  await page.getByRole('button', { name: '地方政府', exact: true }).click();
  await expect(
    page.locator('.role-grid').getByRole('button', { name: /人民與公民參與/ }),
  ).toBeVisible();
  await page
    .locator('.role-grid')
    .getByRole('button', { name: /人民與公民參與/ })
    .click();
  await expect(page.locator('.role-inspector > h2')).toHaveText('人民與公民參與');
  await page.getByLabel('選擇關係種類').selectOption('election');
  await expect(page.locator('.relation-list')).toContainText('相應縣市首長');
  await expect(page.locator('.relation-list')).not.toContainText('總統');
  await page.locator('.agency-picker-trigger').click();
  await expect(page.locator('.agency-picker-options button')).toHaveCount(36);
  await page
    .locator('.agency-picker-options')
    .getByRole('button', { name: /^交通局/ })
    .click();
  await expect(page.locator('.role-inspector > h2')).toHaveText('交通局');
  await expect(page.locator('.agency-inspection')).toContainText('公車路線');
  await page.getByLabel('地方機關名單').selectOption('miaoli');
  await expect(page.locator('.agency-picker-options button')).toHaveCount(23);
  await page
    .locator('.agency-picker-options')
    .getByRole('button', { name: /^交通工務處/ })
    .click();
  await expect(page.locator('.role-inspector > h2')).toHaveText('交通工務處');
  await expect(page.locator('.agency-inspection')).toContainText('工程');
  await expect(page.locator('.agency-inspection')).toContainText('公共運輸');
  await page.getByLabel('地方機關名單').selectOption('taipei');
  await expect(page.locator('.agency-picker-options button')).toHaveCount(32);
  await page
    .locator('.agency-picker-options')
    .getByRole('button', { name: /^都市計畫委員會/ })
    .click();
  await expect(page.locator('.role-inspector > h2')).toHaveText('都市計畫委員會');
  await expect(page.locator('.agency-inspection')).toContainText('專責審議');
  await page.getByRole('button', { name: '關閉機關選擇', exact: true }).click();
  await page
    .locator('.role-grid')
    .getByRole('button', { name: /直轄市長／縣長／市長/ })
    .click();
  await expect(page.locator('.agency-inspection')).toHaveCount(0);
  await expect(page.getByLabel('選擇關係種類')).toBeVisible();
});

test('機關卡片開啟左側對話框，選擇更新右側，叉叉與Esc可關閉並還原焦點', async ({ page }) => {
  await page.goto('government/');
  const trigger = page.locator('.agency-picker-trigger');
  const reference = page.locator('.role-grid .role-node').nth(1);
  const triggerBounds = await trigger.boundingBox();
  const referenceBounds = await reference.boundingBox();
  expect(Math.abs(triggerBounds!.width - referenceBounds!.width)).toBeLessThan(2);
  expect(Math.abs(triggerBounds!.height - referenceBounds!.height)).toBeLessThan(2);
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: '各部會與中央機關' });
  await expect(dialog).toBeVisible();
  await expect(page.getByLabel('搜尋可點選的單位')).toBeFocused();
  await expect(page.locator('.role-grid')).toHaveAttribute('inert', '');
  const dialogBounds = await dialog.boundingBox();
  const rightBounds = await page.locator('.role-inspector').boundingBox();
  expect(dialogBounds!.x + dialogBounds!.width).toBeLessThanOrEqual(rightBounds!.x);
  await page.getByLabel('搜尋可點選的單位').fill('交通部');
  await dialog.getByRole('button', { name: /^交通部/ }).click();
  await expect(page.locator('.role-inspector > h2')).toHaveText('交通部');
  await expect(dialog).toBeVisible();
  await page.locator('.role-inspector a').first().focus();
  await expect(page.locator('.role-inspector a').first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(page.locator('.role-grid')).not.toHaveAttribute('inert');
  await trigger.click();
  await page.getByRole('button', { name: '關閉機關選擇', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('機關總覽可收合、搜尋中央地方、批次展開並查看全部資料', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('government/');
  const directory = page.locator('.agency-directory');
  await expect(directory).not.toHaveAttribute('open');
  await directory.locator(':scope > summary').click();
  await expect(page.locator('.agency-entry')).toHaveCount(agencyData.entries.length);
  await page.getByLabel('搜尋機關或服務事項').fill('交通');
  await expect(page.locator('.agency-entry')).toContainText(['交通部']);
  await expect(page.locator('.agency-entries')).toContainText('交通局');
  const shown = await page.locator('.agency-entry').count();
  await directory.getByRole('button', { name: '全部展開', exact: true }).click();
  await expect(page.locator('.agency-entry[open]')).toHaveCount(shown);
  await directory.getByRole('button', { name: '全部收合', exact: true }).click();
  await expect(page.locator('.agency-entry[open]')).toHaveCount(0);
  await directory.getByRole('button', { name: /^地方局處/ }).click();
  await expect(page.locator('.agency-entry h3').filter({ hasText: /^交通部$/ })).toHaveCount(0);
  await page.getByLabel('搜尋機關或服務事項').fill('xyz不存在');
  await expect(page.locator('.agency-empty')).toBeVisible();
  await directory.getByRole('button', { name: '清除篩選', exact: true }).click();
  await expect(page.locator('.agency-entry')).toHaveCount(agencyData.entries.length);
  await directory.getByRole('button', { name: '全部展開', exact: true }).click();
  await expect(page.locator('.agency-entry[open]')).toHaveCount(agencyData.entries.length);
  await expect(page.locator('.agency-entry-body').first()).toContainText('主要在做什麼');
  await directory.locator(':scope > summary').click();
  await expect(directory).not.toHaveAttribute('open');
  await directory.locator(':scope > summary').click();
  await expect(page.locator('.agency-entry[open]')).toHaveCount(agencyData.entries.length);
  await page.locator('.local-agency-directories > summary').click();
  await expect(page.locator('.local-agency-directories a')).toHaveCount(22);
  await page.locator('.local-reference-inventories > summary').click();
  await expect(page.locator('.local-reference-inventories dl > div')).toHaveCount(55);
  expect(errors).toEqual([]);
});

test('手機點選機關會帶到可閱讀的說明，並通過無障礙檢查', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('government/');
  await page.locator('.agency-picker-trigger').click();
  await page.getByLabel('搜尋可點選的單位').fill('交通部');
  await page
    .locator('.agency-picker-options')
    .getByRole('button', { name: /^交通部/ })
    .click();
  const heading = page.locator('.role-inspector > h2');
  await expect(heading).toHaveText('交通部');
  await expect(heading).toBeInViewport();
  await expect(page.locator('.agency-inspection')).toContainText('通勤');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const results = await new AxeBuilder({ page })
    .include('.government-workspace')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(
    results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
  ).toEqual([]);
});

test('展開的機關總覽在手機可閱讀並通過無障礙檢查', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('government/');
  await page.locator('.agency-directory > summary').click();
  await page.getByLabel('搜尋機關或服務事項').fill('政風');
  await page
    .locator('.agency-directory')
    .getByRole('button', { name: '全部展開', exact: true })
    .click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const results = await new AxeBuilder({ page })
    .include('#agency-directory')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(
    results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
  ).toEqual([]);
});

test('媒體練習可看證據、答錯、修改及不作答讀解析', async ({ page }) => {
  await page.goto('media-literacy/headline-context/');
  await expect(page.getByText('虛構教學情境 · 非真實事件')).toBeVisible();
  await page.getByRole('button', { name: '展開全部', exact: true }).click();
  await expect(page.locator('.evidence-card[open]')).toHaveCount(2);
  await page.getByRole('radio').nth(0).check();
  await page.getByRole('button', { name: '看看解析', exact: true }).click();
  await expect(page.locator('.quiz-feedback')).toContainText('再多看一個線索');
  await page.getByRole('radio').nth(1).check();
  await page.getByRole('button', { name: '看看解析', exact: true }).click();
  await expect(page.locator('.quiz-feedback')).toContainText('有找到關鍵');
  await page.getByRole('button', { name: '再想一次' }).click();
  await page.getByRole('button', { name: '先閱讀解析', exact: true }).click();
  await expect(page.locator('.quiz-feedback')).toBeVisible();
  await page.getByRole('button', { name: '我讀完了，記下這個方法' }).click();
  await expect(page.getByRole('button', { name: '已完成這次練習' })).toBeVisible();
});

test('來源、聯絡信箱與隱私說明可用', async ({ page }) => {
  await page.goto('about/');
  await expect(page.locator('a.email-address')).toHaveAttribute(
    'href',
    'mailto:amaochen0110@gmail.com',
  );
  await page.goto('privacy/');
  await expect(page.getByRole('heading', { name: '網站使用統計' })).toBeVisible();
  await expect(page.locator('.consent-panel')).toHaveCount(0);
  await page.goto('sources/');
  await expect(page.locator('.source-catalog article')).toHaveCount(sourceData.sources.length + 1);
});

test('手機導覽、預設動畫與主要頁面不水平溢出', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('./');
  await page.getByRole('button', { name: '開啟導覽' }).click();
  await expect(page.getByRole('navigation', { name: '主要導覽' })).toBeVisible();
  await page
    .getByRole('navigation', { name: '主要導覽' })
    .getByRole('link', { name: '公民入門', exact: true })
    .click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('不必先懂政治');
  await expect(page.getByRole('button', { name: '減少動畫' })).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'full');
  for (const path of [
    './',
    'my-ballots/',
    'government/',
    'justice/',
    'media-literacy/',
    'learn/democracy-and-rights/',
    'about/',
  ]) {
    await page.goto(path);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    if (path === 'government/') {
      const caption = await page.locator('.questioning-table caption').boundingBox();
      const table = await page.locator('.questioning-table').boundingBox();
      expect(caption!.width).toBeGreaterThan(table!.width * 0.9);
      expect(caption!.height).toBeLessThan(100);
    }
  }
});

test('無JavaScript仍能閱讀完整文章、角色與題目', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(baseURL + 'learn/democracy-and-rights/');
  await expect(page.locator('.article-section')).toHaveCount(4);
  const sources = page.locator('.source-disclosure');
  await expect(sources).not.toHaveAttribute('open');
  await expect(sources.locator('.source-list')).toBeHidden();
  await sources.locator(':scope > summary').focus();
  await page.keyboard.press('Enter');
  await expect(sources.locator('.source-list')).toBeVisible();
  await expect(sources.locator('.source-list')).toContainText('依據與延伸閱讀');
  await page.keyboard.press('Space');
  await expect(sources.locator('.source-list')).toBeHidden();
  await page.goto(baseURL + 'government/');
  await page.locator('.all-roles > summary').click();
  await expect(page.locator('.all-roles > section')).toHaveCount(civicData.roles.length);
  await expect(page.locator('#central-ministers .office-list li')).toHaveCount(15);
  await page.locator('#miaoli-heads').getByText(/^查看 \d+ 項職務$/).click();
  await expect(page.locator('#miaoli-heads .office-list')).toContainText('交通工務處處長');
  await expect(page.locator('.questioning-table')).toContainText('立法委員');
  await page.locator('.agency-directory > summary').click();
  await expect(page.locator('.agency-entry')).toHaveCount(agencyData.entries.length);
  const transport = page
    .locator('.agency-entry')
    .filter({ has: page.locator('h3').getByText('交通部', { exact: true }) });
  await transport.locator(':scope > summary').click();
  await expect(transport.locator('.agency-entry-body')).toBeVisible();
  await expect(transport.locator('.agency-entry-body')).toContainText('主要在做什麼');
  await page.goto(baseURL + 'media-literacy/chart-scale/');
  await expect(page.locator('.practice-material')).toBeVisible();
  await page.locator('.full-explanation summary').click();
  await expect(page.locator('.full-explanation')).toContainText('10%');
  await context.close();
});

test('metadata、深層重整與真正404', async ({ page, request, baseURL }) => {
  await page.goto('learn/local-government/');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('縣、市、鄉、鎮、區');
  const canonical = await page.locator('link[rel=canonical]').getAttribute('href');
  expect(canonical).toBe(
    (process.env.TEST_CANONICAL_ORIGIN
      ? process.env.TEST_CANONICAL_ORIGIN + (process.env.NEXT_PUBLIC_BASE_PATH ?? '') + '/'
      : baseURL) + 'learn/local-government/',
  );
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
  const response = await request.get(baseURL + 'not-a-real-page/');
  expect(response.status()).toBe(404);
  expect(await response.text()).toContain('這頁好像走遠了');
  expect((await request.get(baseURL + 'sitemap.xml')).status()).toBe(200);
  const verification = await request.get(baseURL + 'googlec50a17ce59ee8c3c.html', {
    maxRedirects: 0,
  });
  expect(verification.status()).toBe(200);
  expect(await verification.body()).toEqual(await readFile('googlec50a17ce59ee8c3c.html'));
  expect((await request.get(baseURL + 'Images/Site/og-default.png')).status()).toBe(200);
});

test('主要頁面通過WCAG 2.2 AA自動檢查並保存畫面', async ({ page }) => {
  const failures: string[] = [];
  for (const path of [
    './',
    'learn/',
    'my-ballots/',
    'government/',
    'media-literacy/',
    'about/',
    'privacy/',
  ]) {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    if (results.violations.length)
      failures.push(
        `${path}: ${JSON.stringify(results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })))}`,
      );
  }
  await mkdir('.qa', { recursive: true });
  await page.goto('./');
  await page.screenshot({ path: '.qa/home-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: '.qa/home-mobile.png', fullPage: true });
  expect(failures).toEqual([]);
});
