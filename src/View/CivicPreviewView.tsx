'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { Users, ArrowDown, ArrowRight, Landmark, Vote, Sparkles, X } from 'lucide-react';
import type { CivicPreviewMode, CivicPreviewProps } from '@/Model/CivicModel';
export function CivicPreviewView({ groups }: CivicPreviewProps) {
  const [mode, setMode] = useState<CivicPreviewMode>('execute');
  const [expanded, setExpanded] = useState(false);
  const lastTrigger = useRef<HTMLButtonElement | null>(null);
  function explore(nextMode: CivicPreviewMode, trigger: HTMLButtonElement) {
    lastTrigger.current = trigger;
    setMode(nextMode);
    setExpanded(true);
  }
  return (
    <div className="civic-preview">
      <div className="preview-label">
        <span className="live-dot" />
        一張圖，開始認識民主<span>公民筆記 001</span>
      </div>
      <div className="preview-people">
        <Users size={23} />
        <strong>我們，每一個人</strong>
        <small>權力，來自人民</small>
      </div>
      <div className="preview-vote">
        <span />
        <span>
          <Vote size={16} />
          透過選舉
        </span>
        <span />
      </div>
      <div className="preview-branches">
        <button
          type="button"
          className={`preview-building ${mode === 'execute' ? 'highlight' : ''}`}
          aria-expanded={expanded && mode === 'execute'}
          aria-controls="preview-role-details"
          onClick={(event) => explore('execute', event.currentTarget)}
        >
          <span className="building-label">行政團隊</span>
          <span className="building-drawing" aria-hidden="true">
            <span className="building-roof" />
            <span className="building-columns">
              <i />
              <i />
              <i />
              <i />
            </span>
            <span className="building-steps" />
          </span>
          <strong>把事情做好</strong>
          <small>推動政策・依法執行</small>
          <span className="preview-building-hint">
            點一下看分工 <ArrowRight size={12} />
          </span>
        </button>
        <button
          type="button"
          className={`preview-building ${mode === 'oversee' ? 'highlight' : ''}`}
          aria-expanded={expanded && mode === 'oversee'}
          aria-controls="preview-role-details"
          onClick={(event) => explore('oversee', event.currentTarget)}
        >
          <span className="building-label">民意代表</span>
          <span className="building-drawing parliament" aria-hidden="true">
            <span className="building-roof" />
            <span className="building-columns">
              <i />
              <i />
              <i />
              <i />
            </span>
            <span className="building-steps" />
          </span>
          <strong>把權力看好</strong>
          <small>審議預算・依法監督</small>
          <span className="preview-building-hint">
            點一下看分工 <ArrowRight size={12} />
          </span>
        </button>
      </div>
      <div className="preview-check">
        <Landmark size={16} />
        行政與民意機關，各有分工與界線。
      </div>
      <div className="preview-tabs" aria-label="探索政府分工">
        <button
          type="button"
          aria-pressed={mode === 'execute'}
          aria-controls="preview-role-details"
          onClick={(event) => explore('execute', event.currentTarget)}
        >
          <span>01</span>誰負責做事？
        </button>
        <button
          type="button"
          aria-pressed={mode === 'oversee'}
          aria-controls="preview-role-details"
          onClick={(event) => explore('oversee', event.currentTarget)}
        >
          <span>02</span>誰負責監督？
        </button>
      </div>
      <p className="preview-caption" aria-live="polite">
        <Sparkles size={16} />
        {mode === 'execute'
          ? '行政機關負責施政；不是每位官員都由人民直選。'
          : '民意代表審議與監督，不是直接指揮工程的主管。'}
      </p>
      <section
        id="preview-role-details"
        className="preview-detail"
        aria-labelledby="preview-detail-title"
        hidden={!expanded}
      >
        <div className="preview-detail-heading">
          <h2 id="preview-detail-title">
            {mode === 'execute' ? '誰負責把事情做好？' : '誰負責把權力看好？'}
          </h2>
          <button
            type="button"
            className="quiet-button preview-detail-close"
            aria-label="收起分工說明"
            onClick={() => {
              setExpanded(false);
              lastTrigger.current?.focus();
            }}
          >
            <X size={18} />
          </button>
        </div>
        <ul>
          {groups[mode].map((role) => (
            <li key={role.id}>
              <span className="preview-detail-scope">
                {role.level === 'central' ? '中央' : '地方'}
              </span>
              <div>
                <h3>{role.name}</h3>
                <p>{role.summary}</p>
              </div>
            </li>
          ))}
        </ul>
        <Link href="/government/" className="preview-detail-link">
          打開完整政府關係圖 <ArrowRight size={15} />
        </Link>
      </section>
      <div className="preview-corner" aria-hidden="true">
        <ArrowDown size={20} />
      </div>
    </div>
  );
}
