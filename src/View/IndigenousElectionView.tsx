import type {
  IndigenousCouncilGuideProps,
  IndigenousElectionGuideProps,
} from '@/Model/ElectionModel';
import { ElectionService } from '@/Service/ElectionService';
import { SourceList } from './SourceView';
import Link from 'next/link';
import { ArrowUpRight, ChevronDown } from 'lucide-react';

function IndigenousCouncilGuide({ guide }: IndigenousCouncilGuideProps) {
  return (
    <section
      id="indigenous-council-guide"
      className="indigenous-council-guide"
      aria-labelledby="indigenous-council-title"
    >
      <h3 id="indigenous-council-title">{guide.title}</h3>
      <p>{guide.intro}</p>
      <p className="muted">{guide.terminology}</p>
      <div className="indigenous-council-takeaways">
        {guide.takeaways.map((item) => (
          <article key={item.title}>
            <h4>{item.title}</h4>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
      <details id="indigenous-council-seats" className="indigenous-council-detail">
        <summary>
          <h4>展開22縣市的2026席次比較</h4>
          <ChevronDown size={22} aria-hidden="true" />
        </summary>
        <div>
          <p className="indigenous-seat-note">{guide.snapshot.note}</p>
          <table className="indigenous-seat-table">
            <caption>{guide.snapshot.title}（單位：席）</caption>
            <thead>
              <tr>
                <th scope="col">縣市</th>
                <th scope="col">平地</th>
                <th scope="col">山地</th>
                <th scope="col">合併</th>
              </tr>
            </thead>
            <tbody>
              {guide.snapshot.rows.map((row) => (
                <tr key={row.countyId} id={`indigenous-seat-${row.countyId}`}>
                  <th scope="row">{row.county}</th>
                  <td>{row.plains}</td>
                  <td>{row.mountain}</td>
                  <td>{row.combined}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted">
            公告：{guide.snapshot.announcedAt} · 投票：{guide.snapshot.electionDate}
          </p>
          <SourceList sourceIds={guide.snapshot.sourceIds} compact headingLevel="h4" />
        </div>
      </details>
      {guide.questions.map((item) => (
        <details
          key={item.id}
          id={`indigenous-council-${item.id}`}
          className="indigenous-council-detail"
        >
          <summary>
            <h4>{item.title}</h4>
            <ChevronDown size={22} aria-hidden="true" />
          </summary>
          <div>
            <p className="indigenous-council-answer">{item.answer}</p>
            {item.paragraphs.map((text) => (
              <p key={text}>{text}</p>
            ))}
            {item.example && (
              <aside className="more-example">
                <h4>{item.example.title}</h4>
                <p>{item.example.text}</p>
              </aside>
            )}
            <details className="more-sources">
              <summary>查看這個問題的官方依據</summary>
              <SourceList sourceIds={item.sourceIds} compact headingLevel="h4" />
            </details>
          </div>
        </details>
      ))}
    </section>
  );
}

export function IndigenousElectionView({
  guide,
  districts,
  checkedAt,
}: IndigenousElectionGuideProps) {
  const sourceIds = ElectionService.indigenousSourceIds();
  return (
    <section
      id="indigenous-guide"
      className="indigenous-guide"
      aria-labelledby="indigenous-guide-title"
    >
      <div className="section-heading">
        <div>
          <div className="eyebrow">中央、地方一起看</div>
          <h2 id="indigenous-guide-title">{guide.title}</h2>
          <p>{guide.intro}</p>
        </div>
      </div>
      <p className="indigenous-identity-notice">{guide.identityNote}</p>
      <a className="text-link" href="#indigenous-council-guide">
        先看地方議員：席次、合併選區與質詢範圍 ↓
      </a>
      <div className="indigenous-shared">
        {guide.sharedBallots.map((item) => (
          <article key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
      <div className="indigenous-comparisons">
        {guide.comparisons.map((item) => (
          <details key={item.id} id={`indigenous-${item.id}`}>
            <summary>
              <h3>{item.title}</h3>
              <span>展開比較</span>
            </summary>
            <div>
              <div className="indigenous-compare-grid">
                {[
                  ['一般選民', item.general],
                  ['平地原住民', item.plains],
                  ['山地原住民', item.mountain],
                ].map(([title, text]) => (
                  <div key={title}>
                    <h4>{title}</h4>
                    <p>{text}</p>
                  </div>
                ))}
              </div>
              <p className="indigenous-compare-note">{item.note}</p>
            </div>
          </details>
        ))}
      </div>
      <IndigenousCouncilGuide guide={guide.councils} />
      <article className="indigenous-geography">
        <h3>{guide.geography.title}</h3>
        <p>{guide.geography.text}</p>
        <h4>六個直轄市山地原住民區</h4>
        <ul>
          {districts.map((district) => (
            <li key={district}>{district}</li>
          ))}
        </ul>
      </article>
      <article className="indigenous-polling">
        <h3>{guide.polling.title}</h3>
        <p>{guide.polling.text}</p>
      </article>
      <section className="indigenous-checklist">
        <h3>投票前，照這四步確認</h3>
        <ol>
          {guide.checklist.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ol>
        <Link className="text-link" href="/resources/">
          到便民查詢找中選會公告與公報 <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </section>
      <details className="more-sources">
        <summary>查看原住民選舉的官方依據</summary>
        <SourceList sourceIds={sourceIds} compact headingLevel="h3" />
      </details>
      <p className="muted">原住民選舉制度查核：{checkedAt}</p>
    </section>
  );
}
