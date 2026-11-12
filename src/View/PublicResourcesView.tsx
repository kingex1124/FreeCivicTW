'use client';
import { useState } from 'react';
import { ArrowUpRight, Search, SlidersHorizontal, BookOpenCheck } from 'lucide-react';
import { PublicResourceService } from '@/Service/PublicResourceService';
import type {
  PublicResource,
  PublicResourcesViewProps,
  ResourceFilter,
} from '@/Model/PublicResourceModel';

const initial: ResourceFilter = {
  query: '',
  category: 'all',
  level: 'all',
  region: 'all',
  kind: 'all',
};
const levels = {
  central: '中央',
  local: '地方政府',
  judicial: '司法與警檢',
  representative: '民代與議會',
  civic: '民間工具',
} satisfies Record<PublicResource['level'], string>;

export function PublicResourcesView({ data, regions }: PublicResourcesViewProps) {
  const [filter, setFilter] = useState<ResourceFilter>(initial);
  const results = PublicResourceService.filter(data, filter);
  function change<K extends keyof ResourceFilter>(key: K, value: ResourceFilter[K]) {
    setFilter((previous) => ({ ...previous, [key]: value }));
  }
  return (
    <div className="container section-bottom resource-page">
      <div className="resource-intro">
        <BookOpenCheck size={26} aria-hidden="true" />
        <p>
          先搜尋問題，再看用途與限制。這裡包含官方入口和標示為民間的整理工具，每個入口都有使用說明與查核來源。
        </p>
      </div>
      <noscript>
        <style>{'.resource-controls { display: none; }'}</style>
        <p className="notice">未啟用 JavaScript 時，仍可閱讀全部入口並展開使用說明。</p>
      </noscript>
      <form
        className="resource-controls"
        onSubmit={(event) => event.preventDefault()}
        aria-label="尋找便民查詢"
      >
        <label className="resource-search" htmlFor="resource-query">
          <span>你想查什麼？</span>
          <span>
            <Search size={22} aria-hidden="true" />
            <input
              id="resource-query"
              type="search"
              value={filter.query}
              placeholder="例如：豬肉、判決、立委、補助"
              onChange={(event) => change('query', event.target.value)}
            />
          </span>
        </label>
        <div className="resource-examples">
          <span>試試看</span>
          {['豬肉', '判決', '立委', '實價登錄'].map((query) => (
            <button key={query} type="button" onClick={() => setFilter({ ...initial, query })}>
              {query}
            </button>
          ))}
        </div>
        <details className="resource-advanced" open>
          <summary>
            <SlidersHorizontal size={19} aria-hidden="true" />
            進階篩選：主題、單位與地區
          </summary>
          <div>
            <div className="agency-filters resource-categories" role="group" aria-label="查詢主題">
              <button
                type="button"
                aria-pressed={filter.category === 'all'}
                onClick={() => change('category', 'all')}
              >
                全部主題
              </button>
              {data.categories.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={filter.category === item.id}
                  onClick={() => change('category', item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="resource-selects">
              <div>
                <label htmlFor="resource-level">單位類型</label>
                <select
                  id="resource-level"
                  value={filter.level}
                  onChange={(event) =>
                    change('level', event.target.value as ResourceFilter['level'])
                  }
                >
                  <option value="all">全部單位</option>
                  {Object.entries(levels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="resource-region">地區</label>
                <select
                  id="resource-region"
                  value={filter.region}
                  onChange={(event) => change('region', event.target.value)}
                >
                  <option value="all">全國與所有縣市</option>
                  {regions.map((region) => (
                    <option key={region}>{region}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="resource-kind">入口種類</label>
                <select
                  id="resource-kind"
                  value={filter.kind}
                  onChange={(event) => change('kind', event.target.value as ResourceFilter['kind'])}
                >
                  <option value="all">工具與機關首頁</option>
                  <option value="tool">功能型查詢工具</option>
                  <option value="agency">機關首頁與目錄</option>
                </select>
              </div>
            </div>
            {filter.region !== 'all' && (
              <p className="muted">
                地區篩選會只顯示該縣市的入口；要查全國性工具，請選「全國與所有縣市」。
              </p>
            )}
          </div>
        </details>
        <div className="resource-toolbar">
          <p role="status" aria-live="polite">
            找到 {results.length}／{data.entries.length} 個查詢入口
          </p>
          <button className="quiet-button" type="button" onClick={() => setFilter(initial)}>
            清除全部篩選
          </button>
        </div>
      </form>
      <section aria-labelledby="resource-results-heading">
        <h2 id="resource-results-heading" className="resource-results-heading">
          官方網站與民間查詢工具
        </h2>
        {results.length === 0 && (
          <div className="resource-empty">
            <h3>目前沒有符合的入口</h3>
            <p>試著換個關鍵字，或清除篩選。沒有收錄，不代表政府沒有提供這項服務。</p>
            <button type="button" className="button-secondary" onClick={() => setFilter(initial)}>
              查看全部入口
            </button>
          </div>
        )}
        <div className="resource-grid">
          {results.map((item) => (
            <article className="resource-card" id={`resource-${item.id}`} key={item.id}>
              <div className="resource-tags">
                {levels[item.level] && (
                  <span>
                    {levels[item.level]}
                    {item.region && ` · ${item.region}`}
                  </span>
                )}
                <span>
                  {item.kind === 'tool'
                    ? data.categories.find((category) => category.id === item.category)?.label
                    : '機關入口'}
                </span>
              </div>
              <h3>{item.title}</h3>
              <p className="resource-agency">{item.agency}</p>
              <p className="resource-summary">{item.summary}</p>
              <h4>可以查到什麼？</h4>
              <ul>
                {item.canFind.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
              <a
                className="resource-link"
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {item.level === 'civic' ? '前往民間網站' : '前往官方網站'}{' '}
                <ArrowUpRight size={19} aria-hidden="true" />
                <span className="sr-only">：{item.title}（另開分頁）</span>
              </a>
              <details className="resource-guide">
                <summary>使用方法與注意事項</summary>
                <div>
                  <h4>怎麼開始？</h4>
                  <ol>
                    {item.howToUse.map((text) => (
                      <li key={text}>{text}</li>
                    ))}
                  </ol>
                  <h4>使用前留意</h4>
                  <ul>
                    {item.limitations.map((text) => (
                      <li key={text}>{text}</li>
                    ))}
                  </ul>
                  <p className="resource-verification">
                    <a href={item.verificationUrl} target="_blank" rel="noopener noreferrer">
                      官方查核依據<span className="sr-only">：{item.title}（另開分頁）</span>
                    </a>{' '}
                    · 本站核對 {item.checkedAt}
                  </p>
                  <p className="resource-address">{item.url}</p>
                </div>
              </details>
            </article>
          ))}
        </div>
      </section>
      <aside className="resource-note">
        <h2>這裡收錄哪些入口？</h2>
        <p>
          本頁整理官方功能型網站、22
          縣市政府與議會、中央部會首頁，以及標示為民間的資料整理工具。並非列盡每個所屬機關的所有子網站；各級法院、檢察及其他單位可由卡片中的官方完整目錄繼續找。
        </p>
        <h2>找到資料後，再多看一步</h2>
        <p>
          先核對發布單位、資料期間、更新日期與統計定義。查不到不代表不存在；公開資料也可能經過遮蔽或有收錄範圍。截圖或單一數字，應搭配原始說明一起看。
        </p>
        <p>
          查詢與申辦請依各外部網站說明進行，正式申辦請確認主管機關的官方入口；本站不代查個人案件，也不取得你在外站輸入的資料。若入口改版失效，請透過頁尾信箱告訴我們。
        </p>
      </aside>
    </div>
  );
}
