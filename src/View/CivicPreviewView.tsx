'use client';
import { useState } from 'react';
import { Users, ArrowDown, Landmark, Vote, Sparkles } from 'lucide-react';
export function CivicPreviewView() {
  const [mode, setMode] = useState<'execute' | 'oversee'>('execute');
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
        <div className={`preview-building ${mode === 'execute' ? 'highlight' : ''}`}>
          <span className="building-label">行政團隊</span>
          <div className="building-drawing">
            <div className="building-roof" />
            <div className="building-columns">
              <i />
              <i />
              <i />
              <i />
            </div>
            <div className="building-steps" />
          </div>
          <strong>把事情做好</strong>
          <small>推動政策・依法執行</small>
        </div>
        <div className={`preview-building ${mode === 'oversee' ? 'highlight' : ''}`}>
          <span className="building-label">民意代表</span>
          <div className="building-drawing parliament">
            <div className="building-roof" />
            <div className="building-columns">
              <i />
              <i />
              <i />
              <i />
            </div>
            <div className="building-steps" />
          </div>
          <strong>把權力看好</strong>
          <small>審議預算・依法監督</small>
        </div>
      </div>
      <div className="preview-check">
        <Landmark size={16} />
        行政與民意機關，各有分工與界線。
      </div>
      <div className="preview-tabs" aria-label="探索政府分工">
        <button aria-pressed={mode === 'execute'} onClick={() => setMode('execute')}>
          <span>01</span>誰負責做事？
        </button>
        <button aria-pressed={mode === 'oversee'} onClick={() => setMode('oversee')}>
          <span>02</span>誰負責監督？
        </button>
      </div>
      <p className="preview-caption" aria-live="polite">
        <Sparkles size={16} />
        {mode === 'execute'
          ? '行政機關負責施政；不是每位官員都由人民直選。'
          : '民意代表審議與監督，不是直接指揮工程的主管。'}
      </p>
      <div className="preview-corner" aria-hidden="true">
        <ArrowDown size={20} />
      </div>
    </div>
  );
}
