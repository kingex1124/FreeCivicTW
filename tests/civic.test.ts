import test from 'node:test';
import assert from 'node:assert/strict';
import { ElectionService } from '@/Service/ElectionService';
import { RegionService } from '@/Service/RegionService';
import { ExerciseService } from '@/Service/ExerciseService';
import { LearningService } from '@/Service/LearningService';
import { MediaLiteracyService } from '@/Service/MediaLiteracyService';
import { SeoService } from '@/Service/SeoService';
import { CivicService } from '@/Service/CivicService';
const lookup = (
  name: string,
  identity: 'general' | 'plains' | 'mountain' | 'unspecified' = 'unspecified',
) => {
  const match = RegionService.search(name);
  assert.equal(match.length, 1);
  return ElectionService.lookup(match[0].county.id, match[0].town.id, identity);
};
test('頭份顯示五類地方職務，中央另列三類', () => {
  const result = lookup('苗栗縣頭份市');
  assert.deepEqual(
    result.local.map((b) => b.title),
    ['苗栗縣長', '苗栗縣議員', '頭份市長', '頭份市民代表', '戶籍所在里長'],
  );
  assert.equal(result.national.length, 3);
});
test('一般直轄市與市轄區不產生民選區長票', () => {
  for (const name of ['臺北市大安區', '嘉義市東區']) {
    const result = lookup(name);
    assert.equal(result.local.length, 3);
    assert(
      !result.local.some((b) => b.roleId === 'district-chief' || b.roleId === 'indigenous-chief'),
    );
  }
});
test('六個山地原住民自治區均有區長與區民代表', () => {
  const matches = RegionService.get().counties.flatMap((c) =>
    c.towns.filter((t) => t.autonomous).map((t) => ({ c, t })),
  );
  assert.equal(matches.length, 6);
  for (const { c, t } of matches) {
    const result = ElectionService.lookup(c.id, t.id);
    assert.equal(result.local.length, 5);
    assert(result.local.some((b) => b.roleId === 'indigenous-chief'));
    assert(result.local.some((b) => b.roleId === 'indigenous-council'));
  }
});
test('鄉村與鎮里的基層職務不同', () => {
  assert.equal(lookup('苗栗縣三灣鄉').local.at(-1)?.title, '戶籍所在村長');
  assert.equal(lookup('苗栗縣竹南鎮').local.at(-1)?.title, '戶籍所在里長');
});
test('離島父層與地方類型正確', () => {
  for (const name of ['澎湖縣馬公市', '金門縣金城鎮', '連江縣南竿鄉'])
    assert.equal(lookup(name).local.length, 5);
});
test('台／臺與空白正規化，相同區名保留歧義', () => {
  assert.equal(RegionService.search(' 台 北 市 大 安 區 ')[0].town.name, '大安區');
  const result = RegionService.search('中正區');
  assert(result.length > 1);
  assert(result.some((r) => r.county.name === '臺北市'));
  assert(result.some((r) => r.county.name === '基隆市'));
});
test('錯誤的縣市父子組合不產生預設答案', () => {
  assert.throws(() => ElectionService.lookup('65000', '10005010'));
  assert.throws(() => ElectionService.lookup('', ''));
});
test('原住民情境替換立委候選人票，地方增加條件提醒而不虛構多一票', () => {
  const general = lookup('苗栗縣頭份市', 'general');
  for (const identity of ['plains', 'mountain'] as const) {
    const result = lookup('苗栗縣頭份市', identity);
    assert.equal(result.national.length, 3);
    assert.match(result.national[1].title, /原住民/);
    assert.deepEqual(
      result.local.map((ballot) => [ballot.id, ballot.title, ballot.summary, ballot.roleId]),
      general.local.map((ballot) => [ballot.id, ballot.title, ballot.summary, ballot.roleId]),
    );
    const council = result.local.find((ballot) => ballot.id === 'county-council')!;
    assert.match(council.electionNote!, /公告.*名冊/);
    assert.notEqual(
      council.electionNote,
      general.local.find((ballot) => ballot.id === 'county-council')!.electionNote,
    );
  }
});
test('所有368地區均有對應且可追溯的六類配置', () => {
  const data = RegionService.get();
  assert.equal(data.counties.length, 22);
  assert.equal(data.counties.flatMap((c) => c.towns).length, 368);
  const ids = new Set<string>();
  for (const c of data.counties)
    for (const t of c.towns) {
      assert(!ids.has(t.id));
      ids.add(t.id);
      const r = ElectionService.lookup(c.id, t.id);
      assert(r.sourceIds.length > 0);
      assert(r.local.every((b) => b.role));
      assert.equal(r.local.length, c.type === 'county' || t.autonomous ? 5 : 3);
    }
});
test('八篇文章具有可讀正文、題目與來源', () => {
  const list = LearningService.getArticles();
  assert.equal(list.length, 8);
  for (const a of list) {
    assert(a.sections.length >= 3);
    assert(a.sections.flatMap((s) => s.paragraphs).join('').length > 500);
    assert(a.sourceIds.length > 0);
    assert(ExerciseService.evaluate(a.quiz, a.quiz.correctOptionId).correct);
    assert.throws(() => ExerciseService.evaluate(a.quiz, 'not-an-option'));
  }
});
test('部長名單包含運動部與數發部，地方職稱及質詢層級分開呈現', () => {
  const data = CivicService.get();
  const central = data.appointmentCatalogs.find((c) => c.id === 'central-ministers')!;
  assert.equal(central.offices.length, 15);
  for (const agency of ['交通部', '數位發展部', '運動部'])
    assert(central.offices.some((o) => o.agency === agency && o.title === `${agency}部長`));
  assert.match(central.procedure, /行政院長提請.*總統任命/);
  const miaoli = data.appointmentCatalogs.find((c) => c.id === 'miaoli-heads')!;
  assert(miaoli.offices.some((o) => o.title === '交通工務處處長'));
  assert(!miaoli.offices.some((o) => o.agency === '交通局'));
  assert.deepEqual(
    data.questioning.venues.map((v) => v.id),
    ['legislature', 'local-council', 'town-representatives', 'autonomous-district'],
  );
});
test('關係圖區分部長提請任命與憲政人事提名、同意、任命', () => {
  const data = CivicService.get();
  const appointments = CivicService.related(data, 'president', 'appointment');
  const ministers = appointments.find((r) => r.to === 'ministers')!;
  assert.match(ministers.label, /行政院長提請/);
  assert.equal(ministers.offices.length, 15);
  assert(ministers.offices.some((o) => o.agency === '數位發展部'));
  assert(
    CivicService.related(data, 'premier', 'appointment').some(
      (r) => r.to === 'ministers' && r.label === '提請總統任命各部部長',
    ),
  );
  for (const id of ['judiciary', 'examination', 'control']) {
    const nomination = CivicService.related(data, 'president', 'consent').find((r) => r.to === id)!;
    assert.match(nomination.label, /提名.*立法院同意/);
    assert.match(appointments.find((r) => r.to === id)!.label, /經立法院同意後任命/);
    assert(CivicService.related(data, id, 'consent').some((r) => r.from === 'legislator'));
  }
  assert.equal(
    appointments.some((r) => r.label.startsWith('提名')),
    false,
  );
});
test('媒體題所有選項均提供解析，錯誤回答仍有說明', () => {
  for (const s of MediaLiteracyService.getScenarios()) {
    const quiz = ExerciseService.fromScenario(s);
    assert.equal(s.isFictional, true);
    for (const o of quiz.options) {
      const result = ExerciseService.evaluate(quiz, o.id);
      assert(result.explanation.length > 5);
      assert.equal(result.correct, o.id === s.correctOptionId);
    }
  }
});
test('地方任用範例使用地方程序，政風不列為地方首長自由任命', () => {
  const data = CivicService.get();
  const appointments = CivicService.related(data, 'county-chief', 'appointment');
  const catalogs = appointments.filter((r) => r.to === 'local-heads');
  assert.equal(catalogs.length, 2);
  assert.deepEqual(
    catalogs.map((r) => r.officeCatalog!.id),
    ['taipei-heads', 'miaoli-heads'],
  );
  for (const r of catalogs) {
    assert(r.offices.length > 0);
    assert(!r.officeCatalog!.procedure.includes('總統'));
    assert(!r.officeCatalog!.relationSummary.includes('部長'));
  }
  for (const chief of ['county-chief', 'town-chief', 'indigenous-chief'])
    assert(!CivicService.related(data, chief, 'appointment').some((r) => r.to === 'integrity'));
  for (const scope of ['central', 'local'] as const)
    assert(CivicService.forScope(data, scope).some((r) => r.id === 'integrity'));
});
test('人民角色同時出現在中央與地方，地方頁籤只列地方選舉關係', () => {
  const data = CivicService.get();
  for (const scope of ['central', 'local'] as const)
    assert(CivicService.forScope(data, scope).some((role) => role.id === 'people'));
  const local = CivicService.related(data, 'people', 'election', 'local');
  assert(local.some((relation) => relation.to === 'county-chief'));
  assert(!local.some((relation) => relation.to === 'president' || relation.to === 'legislator'));
});
test('民代分開列出選民服務與權力界線，選票指南共用完整職掌', () => {
  const data = CivicService.get();
  for (const id of ['legislator', 'county-council', 'town-council', 'indigenous-council']) {
    const role = data.roles.find((r) => r.id === id)!;
    assert(role.powers.length >= 6);
    assert(role.constituentServices!.items.some((item) => item.includes('追蹤')));
    assert(role.constituentServices!.notice.includes('不能保證'));
  }
  const result = lookup('苗栗縣頭份市');
  const legislator = result.national.find((b) => b.roleId === 'legislator')!.role!;
  assert(legislator.constituentServices);
  assert(legislator.performanceChecks.length > 0);
});
test('JSON-LD 序列化不能以文字插入結束 script 標籤', () => {
  const html = SeoService.json({ text: '</script><script>alert(1)</script>' });
  assert(!html.includes('<'));
  assert.deepEqual(JSON.parse(html), { text: '</script><script>alert(1)</script>' });
});
