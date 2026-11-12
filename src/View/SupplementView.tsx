import Link from 'next/link';
import {
  ArrowDown,
  ArrowUpRight,
  ChevronDown,
  BookOpen,
  MessagesSquare,
  Scale,
  Vote,
} from 'lucide-react';
import type {
  SupplementTacticProps,
  SupplementTopicProps,
  SupplementViewProps,
} from '@/Model/SupplementModel';
import { IndigenousElectionView } from './IndigenousElectionView';
import { SourceList } from './SourceView';

function TacticExample({ tactic }: SupplementTacticProps) {
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

function SupplementTopicView({ topic, checkedAt }: SupplementTopicProps) {
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
        <Link
          className="text-link"
          href={topic.id === 'political-debate' ? '/media-literacy/' : '/justice/'}
        >
          {topic.id === 'political-debate'
            ? '試試媒體識讀練習'
            : '回到司法與警檢，看法院、檢察官的分工'}
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
        <a className="text-link" href="#more-topics">
          回到主題選擇 ↑
        </a>
      </div>
      <p className="muted">制度資料查核：{checkedAt} · 例子除特別標示外，均為教學假設。</p>
    </section>
  );
}

export function SupplementView({ data, indigenous }: SupplementViewProps) {
  const links = [
    { id: 'indigenous-guide', title: '原住民選舉', text: '中央、地方的選票與資格比較', Icon: Vote },
    {
      id: 'political-debate',
      title: '政治攻防',
      text: '看懂政治分歧，也辨識誤導話術',
      Icon: MessagesSquare,
    },
    {
      id: 'constitutional-court',
      title: '憲法法庭',
      text: '人民救濟的案例，及審判受阻的影響',
      Icon: Scale,
    },
  ];
  return (
    <div className="container more-layout">
      <nav id="more-topics" className="more-topic-nav" aria-label="補充主題">
        <h2>想多了解哪一題？</h2>
        <p>選一個主題，直接跳到說明。</p>
        <div>
          {links.map(({ id, title, text, Icon }) => (
            <a key={id} href={`#${id}`}>
              <Icon size={23} aria-hidden="true" />
              <span>
                <strong>{title}</strong>
                <span>{text}</span>
              </span>
              <ArrowDown size={18} aria-hidden="true" />
            </a>
          ))}
        </div>
        <p className="more-nav-note">不必一次讀完。每一節都能點開、收起；手機也可以直接閱讀。</p>
      </nav>
      <div className="more-content">
        <IndigenousElectionView {...indigenous} />
        <div className="more-next-links">
          <Link className="text-link" href="/my-ballots/">
            到我的選票指南查民選職務 <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
          <a className="text-link" href="#more-topics">
            回到主題選擇 ↑
          </a>
        </div>
        {data.topics.map((topic) => (
          <SupplementTopicView key={topic.id} topic={topic} checkedAt={data.checkedAt} />
        ))}
      </div>
    </div>
  );
}
