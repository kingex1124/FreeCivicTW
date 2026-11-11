'use client';
import { useMemo, useState } from 'react';
import { MapPin, Search, ArrowRight, RotateCcw, ChevronDown, Vote, Info } from 'lucide-react';
import { RegionService } from '@/Service/RegionService';
import { ElectionService } from '@/Service/ElectionService';
import { AnalyticsService } from '@/Service/AnalyticsService';
import { RoleDetails } from './GovernmentView';
import { SourceList } from './SourceView';
import type { BallotCardProps, BallotResult, IdentityScenario } from '@/Model/ElectionModel';
export function BallotCard({ ballot, index }: BallotCardProps) {
  return (
    <details className="ballot-card">
      <summary>
        <span className="ballot-number">{String(index + 1).padStart(2, '0')}</span>
        <span>
          <strong>{ballot.title}</strong>
          <small>{ballot.summary}</small>
        </span>
        <ChevronDown size={20} />
      </summary>
      <div className="ballot-details">
        {ballot.role ? <RoleDetails role={ballot.role} /> : <p>{ballot.summary}</p>}
        <p className="board-note">
          這是職務種類教學；實際選區、身分及當次可領票資格請查選委會公告。
        </p>
      </div>
    </details>
  );
}
export function ElectionView() {
  const data = RegionService.get();
  const [countyId, setCountyId] = useState('');
  const [townId, setTownId] = useState('');
  const [query, setQuery] = useState('');
  const [identity, setIdentity] = useState<IdentityScenario>('unspecified');
  const [result, setResult] = useState<BallotResult>();
  const [error, setError] = useState('');
  const matches = useMemo(() => RegionService.search(query), [query]);
  const county = RegionService.getCounty(countyId);
  function lookup(c = countyId, t = townId, scenario = identity) {
    try {
      const next = ElectionService.lookup(c, t, scenario);
      setResult(next);
      setError('');
      AnalyticsService.track('ballot_lookup_complete');
    } catch (e) {
      setError(e instanceof Error ? e.message : '暫時無法取得資料，請重新選擇。');
      setResult(undefined);
    }
  }
  function changeIdentity(value: IdentityScenario) {
    setIdentity(value);
    if (result) lookup(countyId, townId, value);
  }
  return (
    <div className="container section-bottom">
      <div className="lookup-layout">
        <section className="lookup-form">
          <div className="eyebrow">
            <MapPin size={15} />
            從你的戶籍地開始
          </div>
          <h2>
            每一張選票，
            <br />
            都有不同的工作。
          </h2>
          <p>
            我們只需要地區，不需要知道你是誰。
            <br />
            現居地可能與戶籍地不同，請以戶籍為準。
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              lookup();
            }}
          >
            <label htmlFor="region-search">
              搜尋地名 <small>例如：頭份、中正區</small>
            </label>
            <div className="search-field">
              <Search size={18} />
              <input
                id="region-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="輸入縣市或鄉鎮市區"
                autoComplete="off"
              />
            </div>
            {query && (
              <div className="search-results" role="region" aria-label="地名搜尋結果">
                <p>
                  {matches.length
                    ? `找到 ${matches.length} 個地區，請確認完整名稱。`
                    : '找不到這個地名，可以改用下方選單。'}
                </p>
                {matches.slice(0, 20).map((m) => (
                  <button
                    type="button"
                    key={m.town.id}
                    onClick={() => {
                      setCountyId(m.county.id);
                      setTownId(m.town.id);
                      setQuery('');
                      setResult(undefined);
                      setError('');
                    }}
                  >
                    <MapPin size={14} />
                    {m.county.name}
                    {m.town.name}
                    <ArrowRight size={14} />
                  </button>
                ))}
                {matches.length > 20 && <p>結果較多，請輸入更完整的地名或使用選單。</p>}
              </div>
            )}
            <div className="field-divider">
              <span />
              或依序選擇
              <span />
            </div>
            <label htmlFor="county">戶籍縣市</label>
            <select
              id="county"
              value={countyId}
              required
              onChange={(e) => {
                setCountyId(e.target.value);
                setTownId('');
                setResult(undefined);
              }}
            >
              <option value="">請選擇縣市</option>
              {data.counties.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <label htmlFor="town">鄉鎮市區</label>
            <select
              id="town"
              value={townId}
              required
              disabled={!county}
              onChange={(e) => {
                setTownId(e.target.value);
                setResult(undefined);
              }}
            >
              <option value="">{county ? '請選擇鄉鎮市區' : '先選擇縣市'}</option>
              {county?.towns.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <label htmlFor="identity">
              立委票別教學情境 <small>不必填寫真實身分</small>
            </label>
            <select
              id="identity"
              value={identity}
              onChange={(e) => changeIdentity(e.target.value as IdentityScenario)}
            >
              <option value="unspecified">先看各種制度差異</option>
              <option value="general">一般區域立委情境</option>
              <option value="plains">平地原住民立委情境</option>
              <option value="mountain">山地原住民立委情境</option>
            </select>
            <button className="button-primary lookup-submit" type="submit">
              看看有哪些職務
              <ArrowRight size={18} />
            </button>
          </form>
          <button
            className="quiet-button clear-lookup"
            onClick={() => {
              setCountyId('');
              setTownId('');
              setIdentity('unspecified');
              setResult(undefined);
              setQuery('');
              setError('');
            }}
          >
            <RotateCcw size={14} />
            清除選擇
          </button>
          <div className="lookup-trust">
            <CheckIcon />
            <span>
              資料在此裝置內比對，
              <br />
              不記錄你的地區與身分情境。
            </span>
          </div>
        </section>
        <div className="lookup-output">
          <p className="sr-only" role="status" aria-live="polite">
            {result
              ? `已找到${result.location}：中央三類票與地方${result.local.length}類民選職務。中央與地方分開呈現。`
              : ''}
          </p>
          <div aria-live="polite">
            {error && (
              <div className="error-message" role="alert">
                {error}
              </div>
            )}
            {!result && (
              <section className="lookup-empty">
                <div className="ballot-illustration" aria-hidden="true">
                  <div>
                    <Vote size={57} />
                  </div>
                  <i />
                  <span>YOUR CIVIC GUIDE</span>
                </div>
                <h2>
                  你選的不只是名字，
                  <br />
                  也是一份公共責任。
                </h2>
                <p>
                  選擇戶籍地後，中央與地方的民選職務
                  <br />
                  會分開列出。每張卡片都能繼續展開。
                </p>
                <button
                  className="text-link"
                  onClick={() => {
                    const match = RegionService.search('苗栗縣頭份市')[0];
                    if (match) {
                      setCountyId(match.county.id);
                      setTownId(match.town.id);
                      lookup(match.county.id, match.town.id);
                    }
                  }}
                >
                  先看頭份市範例
                  <ArrowRight size={16} />
                </button>
                <div className="lookup-example-tags">
                  <span>縣轄市</span>
                  <span>一般區</span>
                  <span>山地原住民區</span>
                </div>
              </section>
            )}
          </div>
          {result && (
            <section className="lookup-results">
              {result.stale && (
                <div className="notice">
                  <Info size={20} />
                  <p>
                    這份規則或地區資料已超過 90
                    天未覆核。以下提供制度參考，請一併查閱最新的官方公告。
                  </p>
                </div>
              )}
              <div className="result-heading">
                <div className="eyebrow">你的制度指南</div>
                <h2>
                  <MapPin size={25} />
                  {result.location}
                </h2>
                <span className="pill">{result.profileLabel}</span>
                <p>點開每個職務，看看能做什麼、又有哪些界線。</p>
              </div>
              <section>
                <div className="ballot-group-heading">
                  <span className="eyebrow">中央選舉</span>
                  <h3>總統與立法委員</h3>
                  <p>一般同日選舉情境的三類票，實際資格另依公告。</p>
                </div>
                {result.national.map((b, i) => (
                  <BallotCard key={b.id} ballot={b} index={i} />
                ))}
              </section>
              <section>
                <div className="ballot-group-heading">
                  <span className="eyebrow">地方選舉</span>
                  <h3>你的地方，有 {result.local.length} 類民選職務</h3>
                  <p>不含公投、補選及另外公告的投票。</p>
                </div>
                {result.local.map((b, i) => (
                  <BallotCard key={b.id} ballot={b} index={i} />
                ))}
              </section>
              <div className="notice">
                <Info size={22} />
                <p>
                  {result.notice} 中央與地方通常是不同的定期選舉，不能全部相加成這次一定領到的票數。
                </p>
              </div>
              <SourceList sourceIds={result.sourceIds} compact />
              <p className="muted">
                規則查核：{result.checkedAt} · 地區快照：{data.checkedAt}
              </p>
            </section>
          )}
        </div>
      </div>
      <noscript>
        <div className="notice">
          <p>
            地區查詢需要
            JavaScript。你仍可閱讀入門文章與政府文字說明；一般區通常有市長、議員與里長三類，縣下鄉鎮市及山地原住民自治區通常有五類地方民選職務。實際資格以官方公告為準。
          </p>
        </div>
      </noscript>
    </div>
  );
}
function CheckIcon() {
  return <Info size={18} />;
}
