/**
 * Refresh the official household-registration county/township code snapshot.
 *
 * Source: National Land Surveying and Mapping Center, Ministry of the Interior.
 * Catalogue and licence: https://data.gov.tw/dataset/102011
 * The API does not supply a publication/version date; publishedAt stays null.
 * checkedAt records our retrieval date, not the source's publication date.
 *
 * Usage: node scripts/update-regions.mjs [--checked-at YYYY-MM-DD]
 * Requires Node.js 22+ and public HTTPS access to api.nlsc.gov.tw.
 * Does not run during a normal build: the committed snapshot works offline.
 */
import { mkdir, writeFile, rename } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const api = 'https://api.nlsc.gov.tw/other';
const dateIndex = process.argv.indexOf('--checked-at');
const checkedAt =
  dateIndex >= 0
    ? process.argv[dateIndex + 1]
    : new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' }).format(new Date());
if (!checkedAt || !/^\d{4}-\d{2}-\d{2}$/.test(checkedAt)) {
  throw new Error('--checked-at must be a YYYY-MM-DD date.');
}

// These six districts implement local autonomy, unlike ordinary districts.
// MOI explanation: https://www.moi.gov.tw/News_Content.aspx?n=11421&s=138585
// Current general framework: https://www.moi.gov.tw/cp.aspx?n=674
const autonomousNames = new Set([
  '新北市烏來區',
  '桃園市復興區',
  '臺中市和平區',
  '高雄市茂林區',
  '高雄市桃源區',
  '高雄市那瑪夏區',
]);

async function download(endpoint) {
  const response = await fetch(`${api}/${endpoint}`, {
    signal: AbortSignal.timeout(30_000),
    headers: { Accept: 'application/xml, text/xml' },
  });
  if (!response.ok) throw new Error(`${endpoint}: HTTP ${response.status}`);
  const xml = await response.text();
  if (!xml.includes('<?xml')) throw new Error(`${endpoint}: expected official XML response`);
  return xml;
}

function entries(xml, tag) {
  return [...xml.matchAll(new RegExp(`<${tag}>\\s*([\\s\\S]*?)\\s*</${tag}>`, 'g'))].map(
    (match) => match[1],
  );
}

function field(xml, tag) {
  const value = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))?.[1]?.trim();
  if (!value) throw new Error(`Missing XML field: ${tag}`);
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function townType(name) {
  if (name.endsWith('區')) return 'district';
  if (name.endsWith('市')) return 'city';
  if (name.endsWith('鎮')) return 'town';
  if (name.endsWith('鄉')) return 'township';
  throw new Error(`Unknown township administrative type: ${name}`);
}

const countyRecords = entries(await download('ListCounty'), 'countyItem');
const counties = [];
for (const record of countyRecords) {
  const id = field(record, 'countycode01');
  const name = field(record, 'countyname');
  const nlscCode = field(record, 'countycode');
  if (!/^\d{5}$/.test(id) || !/^[A-Z]$/.test(nlscCode)) {
    throw new Error(`Invalid official county code: ${id}/${nlscCode}`);
  }
  const type = /^6[3-8]000$/.test(id) ? 'municipality' : name.endsWith('縣') ? 'county' : 'city';
  const towns = entries(await download(`ListTown1/${nlscCode}`), 'townItem')
    .map((item) => {
      const townId = field(item, 'towncode');
      const townName = field(item, 'townname');
      if (!/^\d{8}$/.test(townId) || !townId.startsWith(id)) {
        throw new Error(`Invalid official township parent/code: ${name}${townName}/${townId}`);
      }
      return {
        id: townId,
        name: townName,
        type: townType(townName),
        autonomous: autonomousNames.has(name + townName),
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
  if (!towns.length) throw new Error(`No townships returned for ${name}`);
  counties.push({ id, name, type, towns });
}
counties.sort((a, b) => a.id.localeCompare(b.id));

const allTowns = counties.flatMap((county) => county.towns);
const autonomous = allTowns.filter((town) => town.autonomous);
const expectedCounts = { municipality: 6, county: 13, city: 3 };
if (counties.length !== 22 || allTowns.length !== 368 || autonomous.length !== 6) {
  throw new Error(
    `Coverage changed (${counties.length} counties / ${allTowns.length} towns / ${autonomous.length} autonomous districts). Review the source and update expectations before publication.`,
  );
}
for (const [type, expected] of Object.entries(expectedCounts)) {
  if (counties.filter((county) => county.type === type).length !== expected) {
    throw new Error(`Unexpected county classification count for ${type}`);
  }
}
if (new Set(allTowns.map((town) => town.id)).size !== 368)
  throw new Error('Duplicate township codes');
if (new Set(counties.map((county) => county.id)).size !== 22)
  throw new Error('Duplicate county codes');
if (autonomous.some((town) => town.type !== 'district'))
  throw new Error('Autonomy exception must be a district');

const snapshot = {
  schemaVersion: 1,
  contentStatus: 'published',
  checkedAt,
  source: {
    title: '代碼服務－縣市清單及鄉鎮市區清單（戶政）官方 API 快照',
    publisher: '內政部國土測繪中心',
    url: 'https://data.gov.tw/dataset/102011',
    publishedAt: null,
    license: '政府資料開放授權條款－第1版（https://data.gov.tw/license）',
  },
  counties,
};
const directory = path.join(root, 'Data');
await mkdir(directory, { recursive: true });
const output = path.join(directory, 'regions.json');
const temporary = path.join(directory, 'regions.json.tmp');
await writeFile(temporary, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
await rename(temporary, output);
console.log(
  `Updated Data/regions.json: ${counties.length} counties, ${allTowns.length} townships/districts, ${autonomous.length} autonomous districts. Checked ${checkedAt}; source publication date not supplied.`,
);
