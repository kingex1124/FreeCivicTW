import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

function exportedRoutes(directory = 'out', relative = ''): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && !entry.name.startsWith('_'))
      return exportedRoutes(path.join(directory, entry.name), `${relative}${entry.name}/`);
    if (entry.name !== 'index.html') return [];
    const html = readFileSync(path.join(directory, entry.name), 'utf8');
    // Next also exports a /404/index.html; only indexable documents belong in the sitemap.
    return /<meta name="robots" content="[^"]*\bnoindex\b/.test(html) ? [] : [relative];
  });
}

test('全站靜態 HTML 含唯一標題描述、canonical、分享資料與可追溯的結構化資料', async ({
  browser,
  request,
  baseURL,
}) => {
  test.setTimeout(90000);
  const canonicalBase = process.env.TEST_CANONICAL_ORIGIN
    ? process.env.TEST_CANONICAL_ORIGIN + (process.env.NEXT_PUBLIC_BASE_PATH ?? '') + '/'
    : baseURL!;
  const xml = await (await request.get('sitemap.xml')).text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  expect([...urls].sort()).toEqual(
    exportedRoutes()
      .map((route) => canonicalBase + route)
      .sort(),
  );
  expect(new Set(urls).size).toBe(urls.length);
  const context = await browser.newContext({ javaScriptEnabled: false });
  const titles = new Set<string>(),
    descriptions = new Set<string>();
  const linkedPaths = new Set<string>();
  try {
    const page = await context.newPage();
    for (const url of urls) {
      expect(url.startsWith(canonicalBase), url).toBe(true);
      const relative = url.slice(canonicalBase.length);
      const response = await page.goto(baseURL! + relative);
      expect(response?.status(), url).toBe(200);
      const head = page.locator('head');
      const title = await page.title();
      const description = await head.locator('meta[name="description"]').getAttribute('content');
      expect(title).toContain('公民自由課');
      expect(title).not.toContain('undefined');
      expect(titles.has(title), title).toBe(false);
      expect(description).toBeTruthy();
      expect(descriptions.has(description!), url).toBe(false);
      titles.add(title);
      descriptions.add(description!);
      await expect(head.locator('link[rel="canonical"]')).toHaveAttribute('href', url);
      await expect(head.locator('meta[property="og:url"]')).toHaveAttribute('content', url);
      await expect(head.locator('meta[property="og:title"]')).toHaveAttribute('content', title);
      await expect(head.locator('meta[name="twitter:title"]')).toHaveAttribute('content', title);
      await expect(head.locator('meta[property="og:image"]')).toHaveAttribute(
        'content',
        canonicalBase + 'Images/Site/og-default.png',
      );
      await expect(head.locator('meta[name="googlebot"]')).toHaveAttribute(
        'content',
        /max-image-preview:large/,
      );
      await expect(page.locator('html')).toHaveAttribute('lang', 'zh-Hant');
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
      const document = JSON.parse(
        await page.locator('script[type="application/ld+json"]').innerText(),
      );
      expect(document.url).toBe(url);
      expect(document.publisher.name).toBe('FreeCivicTW 公民自由課');
      expect(document.publisher.publishingPrinciples).toBe(
        canonicalBase + 'about/#editorial-policy',
      );
      expect(document.dateModified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(xml).toContain(`<lastmod>${document.dateModified}</lastmod>`);
      if (relative) {
        const breadcrumb = document.breadcrumb ?? document.mainEntityOfPage.breadcrumb;
        expect(breadcrumb.itemListElement.at(-1).item).toBe(url);
        if (relative !== 'civic-island/')
          await expect(
            page.getByRole('navigation', { name: '頁面路徑' }).locator('[aria-current="page"]'),
          ).toHaveText(breadcrumb.itemListElement.at(-1).name);
      }
      if (relative.startsWith('learn/') && relative !== 'learn/') {
        expect(document['@type']).toBe('Article');
        expect(document.author.name).toBe('FreeCivicTW 公民自由課');
        expect(document.citation.length).toBeGreaterThan(0);
        await expect(page.locator('.article-review time')).toHaveAttribute(
          'datetime',
          document.dateModified,
        );
        for (const part of document.hasPart)
          expect(await page.locator(new URL(part.url).hash).count()).toBe(1);
      }
      if (relative.startsWith('media-literacy/') && relative !== 'media-literacy/')
        expect(description).toMatch(/^虛構教學情境，非真實事件/);
      for (const href of await page
        .locator('a[href]')
        .evaluateAll((links) => links.map((link) => (link as HTMLAnchorElement).href))) {
        const link = new URL(href);
        if (link.origin === new URL(baseURL!).origin) linkedPaths.add(link.pathname);
      }
    }
    for (const url of urls)
      expect(linkedPaths.has(new URL(url).pathname), `靜態連結可發現 ${url}`).toBe(true);
    const image = await request.get('Images/Site/og-default.png');
    expect(image.status()).toBe(200);
    const bytes = await image.body();
    expect(bytes.subarray(1, 4).toString()).toBe('PNG');
    expect(bytes.readUInt32BE(16)).toBe(1200);
    expect(bytes.readUInt32BE(20)).toBe(630);
  } finally {
    await context.close();
  }
});

test('爬蟲檔案、純文字內容索引與404正確，含查詢參數的頁面仍指向乾淨 canonical', async ({
  page,
  request,
  baseURL,
}) => {
  const xml = await (await request.get('sitemap.xml')).text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const textResponse = await request.get('llms.txt');
  expect(textResponse.status()).toBe(200);
  expect(textResponse.headers()['content-type']).toContain('text/plain');
  const text = await textResponse.text();
  for (const url of urls) expect(text).toContain(`](${url})`);
  expect(text).toContain('虛構教學');
  const robots = await (await request.get('robots.txt')).text();
  expect(robots).toContain('User-Agent: *');
  expect(robots).toContain('Allow: /');
  expect(robots).toContain(new URL('sitemap.xml', urls[0]).href);
  await page.goto('learn/local-government/?utm_source=seo-check');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    urls.find((url) => url.endsWith('/learn/local-government/'))!,
  );
  const response = await page.goto(baseURL + 'seo-missing-page/');
  expect(response?.status()).toBe(404);
  expect(await page.locator('meta[name="robots"]').first().getAttribute('content')).toContain(
    'noindex',
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
});

test('麵包屑與編輯資訊在手機大字、深淺色可閱讀，不影響公民島滿版', async ({ page }) => {
  for (const theme of ['light', 'dark']) {
    await page.addInitScript((value) => localStorage.setItem('fc-color-theme', value), theme);
    await page.setViewportSize({ width: 320, height: 740 });
    for (const route of ['learn/local-government/', 'about/']) {
      await page.goto(route);
      await page.evaluate(() => (document.documentElement.style.fontSize = '20px'));
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(
        result.violations.map((item) => ({
          id: item.id,
          targets: item.nodes.map((node) => node.target),
        })),
        `${theme} ${route}`,
      ).toEqual([]);
    }
  }
  await page.goto('civic-island/');
  await expect(page.locator('.island-map')).toHaveAttribute('data-scene', 'ready');
  await expect(page.getByRole('navigation', { name: '頁面路徑' })).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(() =>
        Math.round(document.querySelector('.island-map')!.getBoundingClientRect().height),
      ),
    )
    .toBe(740);
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(
    true,
  );
});
