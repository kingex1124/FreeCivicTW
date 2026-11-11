import { SiteService } from '@/Service/SiteService';
import { LearningService } from '@/Service/LearningService';
import { RegionService } from '@/Service/RegionService';
import { CivicService } from '@/Service/CivicService';
import { ElectionService } from '@/Service/ElectionService';
import { MediaLiteracyService } from '@/Service/MediaLiteracyService';
import { SourceService } from '@/Service/SourceService';
import { getAgencyDirectory } from '@/Service/AgencyService';
import { JusticeService } from '@/Service/JusticeService';
import assert from 'node:assert/strict';
const unique = (values: string[]) =>
  assert.equal(new Set(values).size, values.length, '資料 ID 必須唯一');
const sources = SourceService.get().sources;
unique(sources.map((s) => s.id));
const sourceIds = new Set(sources.map((s) => s.id));
const justice = JusticeService.get();
unique(justice.groups.map((group) => group.id));
unique(justice.entities.map((entity) => entity.id));
unique(justice.criminalFlow.steps.map((step) => step.id));
unique(justice.courtPaths.map((path) => path.id));
unique(justice.reporting.channels.map((channel) => channel.id));
unique(justice.faq.map((item) => item.id));
for (const items of [
  justice.custodyGuide.concepts,
  justice.custodyGuide.conditions,
  justice.custodyGuide.risk.consequences,
  justice.custodyGuide.review.steps,
])
  unique(items.map((item) => item.id));
for (const id of JusticeService.sourceIds(justice))
  assert(sourceIds.has(id), `司法與警檢來源不存在：${id}`);
for (const entity of justice.entities) {
  assert(
    justice.groups.some((group) => group.id === entity.group),
    `司法分類不存在：${entity.id}`,
  );
  assert.equal(new URL(entity.officialUrl).protocol, 'https:');
}
const agencies = getAgencyDirectory();
unique(agencies.entries.map((entry) => entry.id));
unique(agencies.groups.map((group) => group.id));
unique(agencies.localDirectories.map((county) => county.name));
assert.equal(agencies.localDirectories.length, 22);
for (const entry of agencies.entries) {
  assert(
    agencies.groups.some((group) => group.id === entry.group),
    `機關分類不存在：${entry.id}`,
  );
  for (const id of entry.sourceIds) assert(sourceIds.has(id), `機關來源不存在：${entry.id}／${id}`);
  assert.equal(new URL(entry.officialUrl).protocol, 'https:');
}
for (const inventory of agencies.localInventories) {
  unique(inventory.units.map((unit) => unit.name));
  for (const id of inventory.sourceIds) assert(sourceIds.has(id), `地方完整名單來源不存在：${id}`);
  for (const unit of inventory.units)
    if (unit.profile) {
      for (const id of unit.profile.sourceIds)
        assert(sourceIds.has(id), `特定機關說明來源不存在：${id}`);
    }
  for (const unit of inventory.units)
    for (const id of unit.agencyIds)
      assert(
        agencies.entries.some((entry) => entry.id === id),
        `局處職能對照不存在：${id}`,
      );
}
const regions = RegionService.get();
assert.equal(regions.counties.length, 22);
const towns = regions.counties.flatMap((c) => c.towns);
assert.equal(towns.length, 368);
unique(towns.map((t) => t.id));
assert.equal(towns.filter((t) => t.autonomous).length, 6);
for (const county of regions.counties)
  for (const town of county.towns) {
    assert(town.id.startsWith(county.id));
    const result = ElectionService.lookup(county.id, town.id);
    assert.equal(result.national.length, 3);
    assert.equal(result.local.length, county.type === 'county' || town.autonomous ? 5 : 3);
    assert(result.local.every((b) => b.role));
  }
const civic = CivicService.get();
const roleIds = new Set(civic.roles.map((r) => r.id));
assert(
  civic.roles.every((r) => r.powers.length >= 6),
  '每個角色至少提供六項具體工作',
);
unique(civic.roles.map((r) => r.id));
for (const r of civic.relations)
  assert(roleIds.has(r.from) && roleIds.has(r.to), `關係端點不存在：${r.from} → ${r.to}`);
for (const r of civic.relations)
  if (r.officeCatalogId)
    assert(
      civic.appointmentCatalogs.some((c) => c.id === r.officeCatalogId),
      `關係職務清單不存在：${r.officeCatalogId}`,
    );
for (const role of civic.roles)
  for (const id of role.sourceIds) assert(sourceIds.has(id), `角色來源不存在：${id}`);
unique(civic.appointmentCatalogs.map((c) => c.id));
unique(civic.appointmentCatalogs.flatMap((c) => c.offices.map((o) => o.id)));
unique(civic.questioning.venues.map((v) => v.id));
for (const content of [
  ...civic.appointmentCatalogs,
  ...civic.questioning.venues,
  ...civic.questioning.notes,
  civic.integrityGuide,
  civic.citizenOversight,
])
  for (const id of content.sourceIds) assert(sourceIds.has(id), `任命／質詢來源不存在：${id}`);
const articles = LearningService.getArticles();
assert.equal(articles.length, 8);
unique(articles.map((a) => a.slug));
for (const a of articles) {
  for (const id of a.sourceIds) assert(sourceIds.has(id), `文章來源不存在：${id}`);
  unique(a.sections.map((s) => s.id));
  assert(a.quiz.options.some((o) => o.id === a.quiz.correctOptionId));
  assert(
    a.sections.every((s) => s.paragraphs.join('').length > 60),
    `正文不足：${a.slug}`,
  );
}
const media = MediaLiteracyService.get();
assert.equal(media.contentStatus, 'published');
assert.equal(media.scenarios.length, 6);
unique(media.scenarios.map((s) => s.slug));
for (const s of media.scenarios) {
  unique(s.options.map((o) => o.id));
  assert(s.options.some((o) => o.id === s.correctOptionId));
  assert(s.options.every((o) => s.optionExplanations[o.id]));
  assert(s.isFictional);
}
assert.equal(SiteService.get().contentStatus, 'published');
const articleIds = new Set(articles.map((a) => a.id));
const scenarioIds = new Set(media.scenarios.map((s) => s.id));
for (const p of LearningService.getPaths()) {
  for (const id of p.moduleIds ?? []) assert(articleIds.has(id));
  for (const step of p.summarySteps ?? [])
    for (const id of step.moduleIds) assert(articleIds.has(id));
  for (const id of p.scenarioIds ?? []) assert(scenarioIds.has(id));
}
console.log(
  `資料驗證通過：${regions.counties.length} 縣市／${towns.length} 鄉鎮市區、${articles.length} 篇文章、${civic.roles.length} 角色、${justice.entities.length} 項司法與警檢說明、${media.scenarios.length} 題練習。`,
);
