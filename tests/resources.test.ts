import test from 'node:test';
import assert from 'node:assert/strict';
import { PublicResourceService } from '@/Service/PublicResourceService';
import { RegionService } from '@/Service/RegionService';

const data = PublicResourceService.get();
const initial = { query: '', category: 'all', level: 'all', region: 'all', kind: 'all' } as const;

test('官方入口搜尋支援台臺、多關鍵字與條件交集，查不到不產生預設結果', () => {
  assert(
    PublicResourceService.filter(data, { ...initial, query: '台北市 議會' }).some(
      (item) => item.title === '臺北市議會',
    ),
  );
  assert(
    PublicResourceService.filter(data, { ...initial, query: '豬肉' }).some(
      (item) => item.id === 'pork-dashboard',
    ),
  );
  assert.equal(
    PublicResourceService.filter(data, { ...initial, query: '豬肉', level: 'judicial' }).length,
    0,
  );
  assert.equal(
    PublicResourceService.filter(data, { ...initial, query: '不存在的工具xyz' }).length,
    0,
  );
  const local = PublicResourceService.filter(data, {
    ...initial,
    region: '台北市',
    kind: 'agency',
  });
  assert.equal(local.length, 2);
  assert(local.every((item) => item.region === '臺北市'));
});

test('官方入口涵蓋全臺縣市政府議會，且司法與食安保留資料判讀限制', () => {
  assert.equal(PublicResourceService.regions(data).length, 22);
  for (const county of RegionService.get().counties) {
    assert(
      data.entries.some(
        (item) => item.region === county.name && item.level === 'local' && item.kind === 'agency',
      ),
    );
    assert(
      data.entries.some(
        (item) =>
          item.region === county.name && item.level === 'representative' && item.kind === 'agency',
      ),
    );
  }
  assert(data.entries.filter((item) => item.id.startsWith('homepage-central-')).length >= 30);
  assert(
    data.entries
      .find((item) => item.id === 'judgments')!
      .limitations.some((item) => item.includes('同名')),
  );
  assert(
    data.entries
      .find((item) => item.id === 'pork-dashboard')!
      .limitations.some((item) => item.includes('萊')),
  );
  for (const item of data.entries) {
    assert.equal(new URL(item.url).protocol, 'https:');
    assert.equal(new URL(item.verificationUrl).protocol, 'https:');
  }
});
