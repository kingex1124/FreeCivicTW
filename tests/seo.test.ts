import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { SeoService } from '@/Service/SeoService';
import { SiteService } from '@/Service/SiteService';
import { LearningService } from '@/Service/LearningService';
import { MediaLiteracyService } from '@/Service/MediaLiteracyService';
import { ParticipationService } from '@/Service/ParticipationService';
import { CabinetConfidenceService } from '@/Service/CabinetConfidenceService';

test('SEO 目錄涵蓋每個實際靜態頁與已發布文章、練習，網址、標題與描述不重複', () => {
  function staticRoutes(directory: string, route = '/'): string[] {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory() && !entry.name.startsWith('[')
        ? staticRoutes(path.join(directory, entry.name), `${route}${entry.name}/`)
        : entry.name === 'page.tsx'
          ? [route]
          : [],
    );
  }
  const pages = SeoService.getPages();
  const expected = [
    ...staticRoutes('src/app'),
    ...LearningService.getArticles().map((article) => `/learn/${article.slug}/`),
    ...MediaLiteracyService.getScenarios().map((scenario) => `/media-literacy/${scenario.slug}/`),
  ];
  assert.deepEqual(pages.map((page) => page.path).sort(), expected.sort());
  for (const field of ['path', 'title', 'description'] as const)
    assert.equal(new Set(pages.map((page) => page[field])).size, pages.length, field);
  for (const page of pages) {
    assert.match(page.updatedAt, /^\d{4}-\d{2}-\d{2}$/);
    const metadata = SeoService.metadataFor(page.path);
    assert.equal(metadata.alternates?.canonical, SiteService.absolute(page.path));
  }
  assert.equal(
    SeoService.getPage('/government/').updatedAt,
    [ParticipationService.get().checkedAt, CabinetConfidenceService.get().checkedAt].sort().at(-1),
  );
  assert.equal(
    SeoService.getPage('/media-literacy/').updatedAt,
    MediaLiteracyService.get().updatedAt,
  );
  assert.throws(() => SeoService.getPage('/missing/'), /缺少 SEO/);
});

test('結構化資料以一致發布者串連網站、文章與麵包屑，不虛構發布或專業審查日期', () => {
  for (const page of SeoService.getPages()) {
    const document = JSON.parse(SeoService.json(SeoService.structuredData(page.path)));
    assert.equal(document.url, SiteService.absolute(page.path));
    assert.equal(document.inLanguage, 'zh-Hant-TW');
    assert.equal(document.dateModified, page.updatedAt);
    assert.equal(document.datePublished, undefined);
    assert.equal(document.reviewedBy, undefined);
    assert.equal(document.publisher['@id'], `${SiteService.absolute('/')}#publisher`);
    assert.equal(
      document.publisher.publishingPrinciples,
      SiteService.absolute('/about/#editorial-policy'),
    );
    assert.equal(
      document.publisher.correctionsPolicy,
      SiteService.absolute('/sources/#corrections'),
    );
    if (page.path === '/') continue;
    const breadcrumb = document.breadcrumb ?? document.mainEntityOfPage.breadcrumb;
    assert.equal(breadcrumb.itemListElement.at(-1).item, document.url);
    assert.deepEqual(
      breadcrumb.itemListElement.map((item: { position: number }) => item.position),
      breadcrumb.itemListElement.map((_: unknown, index: number) => index + 1),
    );
    if (document.author) assert.equal(document.author['@id'], document.publisher['@id']);
  }
  const article = LearningService.getArticles()[0];
  assert.deepEqual(
    SeoService.breadcrumbs(`/learn/${article.slug}/`).map((item) => item.path),
    ['/', '/learn/', `/learn/${article.slug}/`],
  );
});

test('虛構情境在搜尋摘要即標明性質，探索索引包含所有正式網址且保留子路徑', () => {
  const text = SeoService.discoveryText();
  assert.match(text, /^# FreeCivicTW 公民自由課/);
  for (const page of SeoService.getPages()) {
    assert(text.includes(`](${SiteService.absolute(page.path)})`));
    if (page.path.startsWith('/media-literacy/') && page.path !== '/media-literacy/')
      assert(page.description.startsWith('虛構教學情境，非真實事件。'));
  }
  assert.match(text, /並非政府機關/);
  assert.match(text, /查核日期/);
});
