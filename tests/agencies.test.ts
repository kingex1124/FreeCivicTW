import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getAgencyDirectory,
  getAgencyCounts,
  searchAgencyEntries,
  getScopedAgencyOptions,
  getAgencyInspection,
} from '@/Service/AgencyService';

test('政府機關總覽涵蓋中央現行機關、地方職能及監督救濟分工', () => {
  const data = getAgencyDirectory();
  const counts = getAgencyCounts(data);
  assert.equal(counts.central, 32);
  assert(counts.local >= 30);
  assert(counts.oversight >= 12);
  for (const name of ['交通部', '數位發展部', '運動部', '行政院公共工程委員會'])
    assert(data.entries.some((entry) => entry.group === 'central' && entry.name === name));
  assert.equal(new Set(data.entries.map((entry) => entry.id)).size, data.entries.length);
  assert.equal(data.localDirectories.length, 22);
  assert.deepEqual(
    data.localInventories.map((inventory) => inventory.units.length),
    [32, 23],
  );
});

test('中央與地方的每個機關按鈕都有工作、生活關聯及來源，複合局處整合多項職能', () => {
  const data = getAgencyDirectory();
  for (const [scope, collection, count] of [
    ['central', 'common', 32],
    ['local', 'common', 36],
    ['local', 'taipei', 32],
    ['local', 'miaoli', 23],
  ] as const) {
    const options = getScopedAgencyOptions(data, scope, collection);
    assert.equal(options.length, count);
    for (const option of options) {
      const inspection = getAgencyInspection(data, option);
      assert(inspection.duties.length >= 3);
      assert(inspection.lifeConnections.length >= 2);
      assert(inspection.limits.length > 0);
      assert(inspection.sourceIds.length > 0);
    }
  }
  const miaoli = getScopedAgencyOptions(data, 'local', 'miaoli');
  const transport = getAgencyInspection(
    data,
    miaoli.find((option) => option.name === '交通工務處')!,
  );
  assert(transport.duties.some((item) => item.includes('公共運輸')));
  assert(transport.duties.some((item) => item.includes('工程')));
  const taipei = getScopedAgencyOptions(data, 'local', 'taipei');
  const planning = getAgencyInspection(
    data,
    taipei.find((option) => option.name === '都市計畫委員會')!,
  );
  assert(planning.duties.every((item) => !item.includes('建築管理')));
  assert(planning.duties.some((item) => item.includes('審議')));
});

test('搜尋可比較中央與地方，台臺一致，分類及無結果不回傳預設答案', () => {
  const data = getAgencyDirectory();
  const traffic = searchAgencyEntries(data, { group: 'all', query: '交通' });
  assert(traffic.some((entry) => entry.group === 'central' && entry.name === '交通部'));
  assert(traffic.some((entry) => entry.group === 'local' && entry.name.includes('交通')));
  const local = searchAgencyEntries(data, { group: 'local', query: '交通' });
  assert(local.length > 0 && local.every((entry) => entry.group === 'local'));
  assert.deepEqual(
    searchAgencyEntries(data, { group: 'all', query: '台北' }),
    searchAgencyEntries(data, { group: 'all', query: '臺北' }),
  );
  assert.equal(searchAgencyEntries(data, { group: 'all', query: '這是不存在的機關xyz' }).length, 0);
  assert.equal(
    searchAgencyEntries(data, { group: 'all', query: '   ' }).length,
    data.entries.length,
  );
});
