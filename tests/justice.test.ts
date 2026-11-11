import test from 'node:test';
import assert from 'node:assert/strict';
import { JusticeService } from '@/Service/JusticeService';
import { SourceService } from '@/Service/SourceService';

test('司法頁涵蓋法院、檢察、警察及協助執行，內容都有可追溯的來源', () => {
  const data = JusticeService.get();
  assert.deepEqual(
    data.groups.map((group) => group.id),
    ['courts', 'prosecution', 'police', 'support'],
  );
  const references = SourceService.resolve(JusticeService.sourceIds(data));
  assert(references.length > 10);
  for (const group of data.groups)
    assert(data.entities.some((entity) => entity.group === group.id));
  for (const entity of data.entities) {
    assert(entity.duties.length >= 3);
    assert(entity.limits.length >= 2);
    assert(entity.sourceIds.length > 0);
    assert.equal(new URL(entity.officialUrl).protocol, 'https:');
  }
});

test('司法搜尋支援台臺與空白正規化，依分類篩選且無結果不回傳預設機關', () => {
  const data = JusticeService.get();
  const search = (query: string) =>
    JusticeService.filter(data, { group: 'all', query }).map((entity) => entity.id);
  assert.deepEqual(search('台 灣'), search('臺灣'));
  assert(search('臺灣').length > 0);
  const police = JusticeService.filter(data, { group: 'police', query: '調查' });
  assert(police.length > 0);
  assert(police.every((entity) => entity.group === 'police'));
  assert.deepEqual(search('完全不存在的司法單位xyz'), []);
});

test('不將檢察官、司法警察、法扶誤列成法院，並保留無罪推定及職權界線', () => {
  const data = JusticeService.get();
  const find = (id: string) => data.entities.find((entity) => entity.id === id)!;
  assert.equal(find('prosecutors').group, 'prosecution');
  assert.equal(find('judicial-police').group, 'police');
  assert.equal(find('lawyers-legal-aid').kind, '協助服務');
  assert.match(find('lawyers-legal-aid').position, /財團法人/);
  assert(find('prosecutors').limits.some((text) => text.includes('不能自行裁定羈押')));
  assert(find('ministry-justice').limits.some((text) => text.includes('不得對個別檢察案件')));
  assert(find('corrections').limits.some((text) => text.includes('尚未有罪確定')));
});

test('行政審級以兩條主要上訴路徑示意，憲法法庭及國民法官不當成額外審級', () => {
  const data = JusticeService.get();
  const administrative = data.courtPaths.find((path) => path.id === 'administrative')!;
  assert.match(administrative.note, /三級二審/);
  assert.equal(administrative.stages.length, 2);
  assert.match(administrative.stages[0], /地方行政訴訟庭 → 高等行政訴訟庭/);
  assert.match(administrative.stages[1], /高等行政訴訟庭 → 最高行政法院/);
  assert.match(data.courtPaths.find((path) => path.id === 'constitutional')!.note, /不是|不能當成/);
  assert.match(
    data.entities.find((entity) => entity.id === 'citizen-judges')!.position,
    /不是新增一級法院/,
  );
});

test('刑事流程保留不起訴與緩起訴分支，按鈴並不強迫先準備訴狀或保證起訴', () => {
  const data = JusticeService.get();
  const decision = data.criminalFlow.steps.find((step) => step.id === 'decision')!;
  assert(decision.outcomes!.some((outcome) => outcome.label === '不起訴'));
  assert(decision.outcomes!.some((outcome) => outcome.label === '緩起訴'));
  const reporting = data.reporting.channels.find((channel) => channel.id === 'prosecutor-report')!;
  assert(reporting.steps.some((step) => step.text.includes('不必先寫好告訴狀')));
  assert(reporting.notes.some((note) => note.includes('不保證')));
  assert(reporting.steps.some((step) => step.text.includes('應立即詢問並製作筆錄')));
  assert(data.faq.some((item) => item.text.includes('聲請准許提起自訴')));
});

test('交保專區保留依法釋放、非必備監控、殘餘風險與不同救濟的界線', () => {
  const data = JusticeService.get();
  const guide = data.custodyGuide;
  assert.match(guide.intro, /將被告釋放/);
  assert.match(guide.intro, /不代表案件結束、無罪或完全不受限制/);
  assert.match(
    guide.conditions.find((item) => item.id === 'monitoring')!.text,
    /並非每件交保都必須配戴/,
  );
  assert.match(guide.risk.text, /無法保證零風險/);
  assert.match(
    guide.risk.consequences.find((item) => item.id === 'forfeiture')!.text,
    /被告逃匿時/,
  );
  assert.match(
    guide.review.steps.find((item) => item.id === 'execution')!.text,
    /沒有停止執行的效力/,
  );
  assert.match(guide.review.steps.find((item) => item.id === 'identify')!.text, /準抗告/);
  assert(JusticeService.sourceIds(data).includes('justice-custody-monitoring-rules'));
  assert(
    JusticeService.filter(data, { group: 'all', query: '交保' }).some(
      (entity) => entity.id === 'judges',
    ),
  );
});
