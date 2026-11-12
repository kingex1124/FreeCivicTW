import Link from 'next/link';
import { ArrowUpRight, ChevronDown, BookOpen, ArrowDown } from 'lucide-react';
import type { TopicTacticProps, TopicContentProps } from '@/Model/TopicContentModel';
import { SourceList } from './SourceView';

function TacticExample({ tactic }: TopicTacticProps) {
  return (
    <details className="more-tactic" id={tactic.id}>
      <summary>
        <h4>{tactic.title}</h4>
        <ChevronDown size={21} aria-hidden="true" />
      </summary>
      <div>
        <p className="more-example-label">以下為假設例子</p>
        <dl>
          <div>
            <dt>原始問題／完整背景</dt>
            <dd>{tactic.original}</dd>
          </div>
          <div>
            <dt>可能誤導的呈現</dt>
            <dd>{tactic.presentation}</dd>
          </div>
          <div>
            <dt>落差在哪裡？</dt>
            <dd>{tactic.gap}</dd>
          </div>
          <div className="more-tactic-check">
            <dt>可以怎麼核對？</dt>
            <dd>{tactic.check}</dd>
          </div>
        </dl>
      </div>
    </details>
  );
}

export function TopicContentView({ topic, checkedAt, returnLink }: TopicContentProps) {
  return (
    <section id={topic.id} className="more-topic" aria-labelledby={`${topic.id}-title`}>
      <div className="section-heading">
        <div>
          <div className="eyebrow">用例子看懂制度</div>
          <h2 id={`${topic.id}-title`}>{topic.title}</h2>
          <p>{topic.intro}</p>
        </div>
      </div>
      <div className="more-takeaways" aria-label={`${topic.shortTitle}重點`}>
        {topic.takeaways.map((item) => (
          <article key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
      <aside className="more-notice">
        <h3>{topic.notice.title}</h3>
        {topic.notice.paragraphs.map((text) => (
          <p key={text}>{text}</p>
        ))}
        <details className="more-sources">
          <summary>查看這段說明的依據</summary>
          <SourceList sourceIds={topic.notice.sourceIds} compact headingLevel="h4" />
        </details>
      </aside>
      {topic.flowOverview && (
        <nav className="legislation-route" aria-label={`${topic.shortTitle}流程捷徑`}>
          <h3>先看整條路，再點步驟讀說明</h3>
          <p>這是主要路徑；覆議與憲法審查是有條件的分支，不是每案必經。</p>
          <ol>
            {topic.flowOverview.map((item, index) => (
              <li key={item.target}>
                <a href={`#${item.target}`}>
                  <span aria-hidden="true">{index + 1}</span>
                  {item.label}
                  <ArrowDown size={18} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}
      <p className="more-reading-hint">點開想了解的小節，保留其他小節收合，慢慢看就好。</p>
      <div className="more-chapters">
        {topic.chapters.map((chapter, index) => (
          <details key={chapter.id} id={chapter.id} className="more-chapter">
            <summary>
              <span className="more-chapter-number" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3>
                <span>{chapter.title}</span>
                <span className="more-chapter-caption">{chapter.summary}</span>
              </h3>
              <ChevronDown size={22} aria-hidden="true" />
            </summary>
            <div className="more-chapter-body">
              {chapter.paragraphs.map((text) => (
                <p key={text}>{text}</p>
              ))}
              {chapter.points.length > 0 && (
                <ul className="more-points">
                  {chapter.points.map((item) => (
                    <li key={item.title}>
                      <h4>{item.title}</h4>
                      <p>{item.text}</p>
                    </li>
                  ))}
                </ul>
              )}
              {chapter.terms && (
                <dl className="legislation-terms">
                  {chapter.terms.map((item) => (
                    <div key={item.term}>
                      <dt>{item.term}</dt>
                      <dd>{item.meaning}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {chapter.example && (
                <aside className="more-example">
                  <h4>
                    <BookOpen size={20} aria-hidden="true" />
                    {chapter.example.title}
                  </h4>
                  <p>{chapter.example.text}</p>
                </aside>
              )}
              {chapter.tactics && (
                <div className="more-tactics">
                  {chapter.tactics.map((tactic) => (
                    <TacticExample key={tactic.id} tactic={tactic} />
                  ))}
                </div>
              )}
              <details className="more-sources">
                <summary>查看本節依據與延伸閱讀</summary>
                <SourceList sourceIds={chapter.sourceIds} compact headingLevel="h4" />
              </details>
            </div>
          </details>
        ))}
      </div>
      <div className="more-next-links">
        {topic.relatedLinks.map((link) => (
          <Link key={link.href} className="text-link" href={link.href}>
            {link.label}
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        ))}
        <a className="text-link" href={returnLink.href}>
          {returnLink.label}
        </a>
      </div>
      <p className="muted">制度資料查核：{checkedAt} · 例子除特別標示外，均為教學假設。</p>
    </section>
  );
}
