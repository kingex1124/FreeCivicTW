import { ExternalLink, BookOpenCheck } from 'lucide-react';
import { SourceService } from '@/Service/SourceService';
import { SiteService } from '@/Service/SiteService';
import { RegionService } from '@/Service/RegionService';
// Server catalog is separate so shared client source cards do not import the full region registry.
export function SourcesPage() {
  const data = SourceService.get();
  const region = RegionService.get();
  return (
    <div className="container reading-wide section-bottom">
      <div className="notice">
        <BookOpenCheck />
        <div>
          <strong>看清楚日期，也看清楚適用範圍。</strong>
          <p>
            查核日期表示本站核對來源的時間，不代表法規在當天修正。法規內容應一併檢查施行日期與相關判決效力。
          </p>
        </div>
      </div>
      <div className="source-catalog">
        {data.sources.map((source) => (
          <article key={source.id} id={source.id}>
            <span className="eyebrow">{source.publisher}</span>
            <h2>
              <a href={source.url} target="_blank" rel="noopener noreferrer">
                {source.title}
                <ExternalLink size={17} />
              </a>
            </h2>
            <p>{source.scope}</p>
            <p className="muted">{source.note}</p>
            <div className="metadata-row">
              <span>來源發布／更新：{source.publishedAt ?? '來源未標示'}</span>
              <span>本站查核：{source.checkedAt}</span>
            </div>
          </article>
        ))}
        <article>
          <span className="eyebrow">官方地區資料</span>
          <h2>
            <a href={region.source.url} target="_blank" rel="noopener noreferrer">
              {region.source.title}
              <ExternalLink size={17} />
            </a>
          </h2>
          <p>
            採官方 5 位縣市碼與 8 位鄉鎮市區碼，涵蓋 {region.counties.length} 縣市、
            {region.counties.reduce((total, county) => total + county.towns.length, 0)} 鄉鎮市區。
            資料快照查核日 {region.checkedAt}，來源發布日：
            {region.source.publishedAt ?? 'API 未提供'}。
          </p>
          <p className="muted">{region.source.license}。地區分類與自治例外另以地方制度來源核對。</p>
        </article>
      </div>
      <section className="corrections">
        <h2>內容更正紀錄</h2>
        {data.corrections.map((c, i) => (
          <div key={i}>
            <span className="pill">{c.date}</span>
            <h3>{c.scope}</h3>
            <p>
              <del>{c.previous}</del>
            </p>
            <p>{c.correction}</p>
          </div>
        ))}
        <a className="button-secondary" href={SiteService.correctionLink('/sources/')}>
          提出內容更正
          <ExternalLink size={16} />
        </a>
      </section>
    </div>
  );
}
