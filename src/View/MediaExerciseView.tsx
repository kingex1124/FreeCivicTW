'use client';
import Link from 'next/link';
import { useState } from 'react';
import { FileSearch, ArrowRight, BookOpenCheck, Check, ArrowLeft } from 'lucide-react';
import { ExerciseService } from '@/Service/ExerciseService';
import { AnalyticsService } from '@/Service/AnalyticsService';
import { ExerciseView } from './ExerciseView';
import { SourceList } from './SourceView';
import type { ScenarioProps } from '@/Model/MediaLiteracyModel';
export function MediaExerciseView({ scenario, nextSlug }: ScenarioProps) {
  const [all, setAll] = useState(false);
  const [finished, setFinished] = useState(false);
  return (
    <div className="container practice-layout section-bottom">
      <aside className="practice-guide">
        <div className="eyebrow">今天練習的方法</div>
        <h2>{scenario.skill}</h2>
        <ol>
          <li>先讀轉貼內容</li>
          <li>想想需要什麼證據</li>
          <li>展開素材找線索</li>
          <li>作答或直接讀解析</li>
        </ol>
        <p>
          想法可以修正。
          <br />
          不確定，也可以先不下結論。
        </p>
        <Link className="text-link" href="/media-literacy/">
          <ArrowLeft size={15} />
          返回全部練習
        </Link>
      </aside>
      <div className="practice-main">
        <div className="fiction-tag">虛構教學情境 · 非真實事件</div>
        <section className="practice-material">
          <div className="material-header">
            <span className="material-avatar">?</span>
            <div>
              <strong>一則被轉傳的訊息</strong>
              <small>來源與脈絡，需要一起確認</small>
            </div>
            <FileSearch size={24} />
          </div>
          <p>{scenario.setup}</p>
          <div className="claim-question">
            <span className="eyebrow">我們要查的是</span>
            <h2>{scenario.claimToCheck}</h2>
          </div>
        </section>
        <section className="evidence-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">先別急著選答案</span>
              <h2>把證據，一張一張打開。</h2>
            </div>
            <button className="quiet-button" onClick={() => setAll(!all)}>
              {all ? '全部收起' : '展開全部'}
            </button>
          </div>
          {scenario.evidence.map((e, i) => (
            <details key={`${e.id}-${all}`} className="evidence-card" open={all}>
              <summary>
                <span className="evidence-number">線索 0{i + 1}</span>
                <strong>{e.label}</strong>
                <span className="evidence-plus">+</span>
              </summary>
              <p>{e.text}</p>
            </details>
          ))}
        </section>
        <ExerciseView
          quiz={ExerciseService.fromScenario(scenario)}
          contentId={scenario.id}
          trackCompletion={false}
        />
        <details className="full-explanation">
          <summary>
            <BookOpenCheck size={19} />
            直接閱讀完整解析
          </summary>
          <p>{scenario.explanation}</p>
        </details>
        <section className="takeaway-box">
          <span className="eyebrow">把方法帶回生活</span>
          <h2>下次遇到時，試試這三步。</h2>
          <ol>
            {scenario.nextActions.map((text, i) => (
              <li key={text}>
                <span>0{i + 1}</span>
                {text}
              </li>
            ))}
          </ol>
        </section>
        <div className="practice-finish">
          <button
            className="button-secondary"
            onClick={() => {
              if (!finished)
                AnalyticsService.track('media_exercise_complete', { content_id: scenario.id });
              setFinished(true);
            }}
          >
            {finished ? (
              <>
                <Check size={17} />
                已完成這次練習
              </>
            ) : (
              '我讀完了，記下這個方法'
            )}
          </button>
          <Link className="button-primary" href={`/media-literacy/${nextSlug}/`}>
            下一個情境
            <ArrowRight size={17} />
          </Link>
        </div>
        <p className="muted">回答不保存，也不產生個人政治傾向或能力排名。</p>
        <SourceList sourceIds={['media-education']} compact summary="查看媒體識讀延伸閱讀" />
        <p className="muted">情境與解析為本站自編；不是官方對真實案件的查核結論。</p>
      </div>
    </div>
  );
}
