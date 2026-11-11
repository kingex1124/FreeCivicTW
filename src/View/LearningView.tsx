import Link from 'next/link';
import { ArrowRight, ArrowLeft, Clock3, Lightbulb, Bookmark, CheckCircle2 } from 'lucide-react';
import { LearningService } from '@/Service/LearningService';
import { SiteService } from '@/Service/SiteService';
import { ExerciseView } from './ExerciseView';
import { SourceList } from './SourceView';
import { SectionHeading } from './SiteView';
import type { ArticleViewProps } from '@/Model/LearningModel';
export function LearningIndexView() {
  const quick = LearningService.quickSteps();
  const articles = LearningService.getArticles();
  return (
    <div className="container section-bottom">
      <section className="quick-start">
        <div className="quick-start-intro">
          <span className="pill dark">先看四個重點</span>
          <h2>
            你的 5 分鐘
            <br />
            公民暖身。
          </h2>
          <p>
            不必先記住所有名稱。
            <br />
            從這四件事開始就好。
          </p>
        </div>
        <div className="quick-step-list">
          {quick.map((a, i) => (
            <details key={a.id} open={i === 0}>
              <summary>
                <span>0{i + 1}</span>
                <strong>
                  {
                    [
                      '有人做事，也有人監督',
                      '同叫「市」，制度可能不同',
                      '投給一個職務，也交付一份權力',
                      '先看證據，再決定相信什麼',
                    ][i]
                  }
                </strong>
              </summary>
              <p>{a.summary}</p>
              <Link className="text-link" href={`/learn/${a.slug}/`}>
                讀完整解釋
                <ArrowRight size={15} />
              </Link>
            </details>
          ))}
        </div>
      </section>
      <section className="section-space">
        <SectionHeading
          eyebrow="不趕時間，照自己的步調"
          title="八篇入門筆記"
          description="可以依順序閱讀，也可以直接選一個你在意的問題。"
        />
        <div className="lesson-list">
          {articles.map((a) => (
            <Link className="lesson-row" key={a.id} href={`/learn/${a.slug}/`}>
              <span className="lesson-number">{String(a.order).padStart(2, '0')}</span>
              <div>
                <h3>{a.title}</h3>
                <p>{a.summary}</p>
              </div>
              <span className="lesson-time">
                <Clock3 size={14} />
                {a.minutes} 分鐘
              </span>
              <span className="round-arrow">
                <ArrowUpRightIcon />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
function ArrowUpRightIcon() {
  return <ArrowRight size={18} className="slanted-arrow" />;
}
export function ArticleView({ article }: ArticleViewProps) {
  const neighbors = LearningService.neighbors(article.slug);
  return (
    <div className="container article-layout section-bottom">
      <aside className="article-toc">
        <div className="eyebrow">這篇筆記裡</div>
        <ol>
          {article.sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`}>{s.title}</a>
            </li>
          ))}
        </ol>
        <Link href="/learn/">
          <ArrowLeft size={15} />
          返回全部筆記
        </Link>
      </aside>
      <article className="article-body">
        <div className="article-opening">
          <Lightbulb size={24} />
          <div>
            <span className="eyebrow">從一個問題開始</span>
            <h2>{article.openingQuestion}</h2>
          </div>
        </div>
        {article.sections.map((section, i) => (
          <section id={section.id} key={section.id} className="article-section">
            <span className="section-counter">0{i + 1}</span>
            <h2>{section.title}</h2>
            {section.paragraphs.map((p, index) => (
              <p key={index}>{p}</p>
            ))}
          </section>
        ))}
        <aside className="example-box">
          <span className="eyebrow">虛構教學情境</span>
          <h3>{article.example.title}</h3>
          <p>{article.example.text}</p>
        </aside>
        <section className="misconception">
          <span className="eyebrow">容易混在一起的事</span>
          <h3>{article.misconception.claim}</h3>
          <p>{article.misconception.correction}</p>
        </section>
        <section className="terms-section">
          <h2>
            <Bookmark size={21} />
            名詞，換成白話
          </h2>
          {article.terms.map((term) => (
            <details key={term.term}>
              <summary>{term.term}</summary>
              <p>{term.definition}</p>
            </details>
          ))}
        </section>
        <ExerciseView quiz={article.quiz} contentId={article.id} />
        <noscript>
          <div className="notice">
            <p>
              本頁仍可閱讀完整內容。理解題參考答案：
              {article.quiz.options.find((o) => o.id === article.quiz.correctOptionId)?.text}。
              {article.quiz.options.find((o) => o.id === article.quiz.correctOptionId)?.explanation}
            </p>
          </div>
        </noscript>
        <SourceList sourceIds={article.sourceIds} />
        <div className="article-review">
          <CheckCircle2 size={16} />
          <span>內容查核：{article.updatedAt}</span>
          <a href={SiteService.correctionLink(`/learn/${article.slug}/`)}>這裡有需要更正的地方？</a>
        </div>
        <nav className="lesson-neighbors" aria-label="相關筆記">
          {neighbors.previous && (
            <Link href={`/learn/${neighbors.previous.slug}/`}>
              <small>
                <ArrowLeft size={14} />
                上一篇
              </small>
              <strong>{neighbors.previous.title}</strong>
            </Link>
          )}
          {neighbors.next && (
            <Link href={`/learn/${neighbors.next.slug}/`}>
              <small>
                下一篇
                <ArrowRight size={14} />
              </small>
              <strong>{neighbors.next.title}</strong>
            </Link>
          )}
        </nav>
      </article>
    </div>
  );
}
