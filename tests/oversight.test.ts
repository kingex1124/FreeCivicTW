import test from 'node:test';
import assert from 'node:assert/strict';
import { OversightService } from '@/Service/OversightService';
import { SourceService } from '@/Service/SourceService';

test('民間團體搜尋可處理台臺、空白，並交集篩選主題與全國地方', () => {
  const data = OversightService.get();
  const filter = { group: 'all', scope: 'all', query: '臺 南 新 芽' } as const;
  const results = OversightService.filter(data, filter);
  assert.deepEqual(
    results.map((item) => item.shortName),
    ['台南新芽'],
  );
  assert.equal(OversightService.filter(data, { ...filter, scope: 'national' }).length, 0);
  assert.equal(OversightService.filter(data, { ...filter, group: 'rights' }).length, 0);
  assert.equal(OversightService.filter(data, { ...filter, query: '沒有這個團體xyz' }).length, 0);
  assert(
    OversightService.filter(data, { ...filter, query: '議事', group: 'councils' }).some(
      (item) => item.id === 'ccw',
    ),
  );
});

test('團體資料涵蓋全國與地方、公開成果及閱讀界線，來源可完整解析', () => {
  const data = OversightService.get();
  assert(data.organizations.length >= 8);
  assert(data.organizations.some((item) => item.scope === 'local'));
  assert(data.organizations.some((item) => item.group === 'rights'));
  for (const organization of data.organizations) {
    assert(organization.work.length >= 3);
    assert(organization.howToUse.length >= 2);
    assert(organization.limits.length >= 2);
  }
  const ids = OversightService.sourceIds(data);
  assert.equal(SourceService.resolve(ids).length, ids.length);
  const ccw = data.organizations.find((item) => item.id === 'ccw')!;
  assert(ccw.howToUse.some((item) => item.includes('權重')));
  assert(ccw.resources.some((item) => item.url === 'https://ppg.ly.gov.tw/ppg/'));
  assert(ccw.limits.some((item) => item.includes('不等於政府法定考核或司法裁判')));
});
