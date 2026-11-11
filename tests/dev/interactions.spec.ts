import { test, expect } from '@playwright/test';

test('區網開發網址能啟動互動、切換政府頁籤與角色', async ({ page, baseURL }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  const connected = page.waitForEvent('websocket', {
    predicate: (socket) => socket.url().includes('/_next/hmr'),
  });
  await page.goto('government/');
  const socket = await connected;
  expect(new URL(socket.url()).hostname).toBe(new URL(baseURL!).hostname);
  await expect(page.locator('html')).toHaveAttribute('data-motion', /^(full|reduced)$/);
  await page.getByRole('button', { name: '地方政府', exact: true }).click();
  await expect(page.getByRole('button', { name: '地方政府', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.locator('.role-inspector > h2')).toHaveText('直轄市長／縣長／市長');
  await page.getByRole('button', { name: /一般區長/ }).click();
  await expect(page.locator('.role-inspector > h2')).toHaveText('一般區長');
  await page.getByRole('button', { name: '中央政府', exact: true }).click();
  await page.getByRole('button', { name: /總統／副總統/ }).click();
  await expect(page.locator('.role-inspector > h2')).toHaveText('總統／副總統');
  await page.getByLabel('選擇關係種類').selectOption('appointment');
  await expect(page.locator('.relation-list')).toContainText('依行政院長提請任命各部部長');
  await page.locator('.relation-offices summary').click();
  await expect(page.locator('.relation-offices .office-list li')).toHaveCount(15);
  await page.getByLabel('選擇關係種類').selectOption('consent');
  await expect(page.locator('.relation-list')).toContainText('提名大法官，須經立法院同意');
  await page.getByRole('button', { name: /各部部長/ }).click();
  await expect(page.locator('.role-inspector > h2')).toHaveText('各部部長');
  expect(errors).toEqual([]);
});

test('開發模式的流程頁籤、步驟按鈕與上下一步會更新內容', async ({ page }) => {
  await page.goto('government/');
  await page.getByRole('button', { name: '下一步', exact: true }).click();
  await expect(page.locator('.flow-current > h3')).toHaveText('總統任命行政院長');
  await page.getByRole('button', { name: '上一步', exact: true }).click();
  await expect(page.locator('.flow-current > h3')).toHaveText('人民選出總統、副總統');
  await page.getByRole('button', { name: '預算從哪裡來，又由誰把關？' }).click();
  await expect(page.locator('.flow-current > h3')).toHaveText('編列需求與財源');
  await page.locator('.flow-progress > button').nth(2).click();
  await expect(page.locator('.flow-current > h3')).toHaveText('依法執行');
  await page.getByRole('button', { name: '重來', exact: true }).click();
  await expect(page.locator('.flow-current > h3')).toHaveText('編列需求與財源');
  await page.getByRole('button', { name: '一個想法怎麼成為法律？' }).click();
  await expect(page.locator('.flow-current > h3')).toHaveText('形成問題與提出法律案');
});

test('區網角色區可展開中央及地方機關，點選會更新機關說明', async ({ page }) => {
  await page.goto('government/');
  await page.locator('.agency-picker-trigger').click();
  await page
    .locator('.agency-picker-options')
    .getByRole('button', { name: /^交通部/ })
    .click();
  await expect(page.locator('.role-inspector > h2')).toHaveText('交通部');
  await expect(page.locator('.agency-inspection')).toContainText('跟我們的生活有什麼關係');
  await page.getByRole('button', { name: '地方政府', exact: true }).click();
  await expect(
    page.locator('.role-grid').getByRole('button', { name: /人民與公民參與/ }),
  ).toBeVisible();
  await page.locator('.agency-picker-trigger').click();
  await page
    .locator('.agency-picker-options')
    .getByRole('button', { name: /^交通局/ })
    .click();
  await expect(page.locator('.role-inspector > h2')).toHaveText('交通局');
  await expect(page.locator('.agency-inspection')).toContainText('公車路線');
});

test('區網表單查詢會保留條件並顯示結果，不重新載入頁面', async ({ page }) => {
  await page.goto('my-ballots/');
  await expect(page.locator('html')).toHaveAttribute('data-motion', /^(full|reduced)$/);
  await page.getByLabel('搜尋地名').fill('頭份');
  await page.getByRole('button', { name: '苗栗縣頭份市', exact: true }).click();
  await page.getByLabel('立委票別教學情境').selectOption('mountain');
  const county = await page.getByLabel('戶籍縣市', { exact: true }).inputValue();
  const town = await page.getByLabel('鄉鎮市區', { exact: true }).inputValue();
  let navigations = 0;
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) navigations++;
  });
  const url = page.url();
  await page.getByRole('button', { name: '看看有哪些職務', exact: true }).click();
  await expect(page.locator('.result-heading > h2')).toHaveText('苗栗縣頭份市');
  await expect(page.locator('.ballot-card')).toHaveCount(8);
  await expect(page.getByLabel('戶籍縣市', { exact: true })).toHaveValue(county);
  await expect(page.getByLabel('鄉鎮市區', { exact: true })).toHaveValue(town);
  await expect(page.getByLabel('立委票別教學情境')).toHaveValue('mountain');
  expect(navigations).toBe(0);
  expect(page.url()).toBe(url);
});

test('開發白名單仍拒絕不受信任的外部來源', async ({ page, request }) => {
  await page.goto('government/');
  const asset = await page.locator('script[src*="/_next/static/"]').first().getAttribute('src');
  expect(asset).toBeTruthy();
  const response = await request.get(asset!, {
    headers: { Origin: 'https://untrusted.example.invalid' },
  });
  expect(response.status()).toBe(403);
});
