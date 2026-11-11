'use client';
import { useRef, useState } from 'react';
import { Check, ArrowRight, RotateCcw } from 'lucide-react';
import { ExerciseService } from '@/Service/ExerciseService';
import { AnalyticsService } from '@/Service/AnalyticsService';
import type { QuizProps } from '@/Model/LearningModel';
export function ExerciseView({ quiz, contentId, trackCompletion = true }: QuizProps) {
  const [selected, setSelected] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [show, setShow] = useState(false);
  const sent = useRef(false);
  const feedback = submitted && selected ? ExerciseService.evaluate(quiz, selected) : undefined;
  return (
    <section className="quiz-box">
      <div className="eyebrow">想一下 · 沒有時間限制</div>
      <h3>{quiz.question}</h3>
      <fieldset>
        <legend className="sr-only">選擇答案</legend>
        {quiz.options.map((option, i) => (
          <label
            key={option.id}
            className={`quiz-option ${selected === option.id ? 'selected' : ''}`}
          >
            <input
              type="radio"
              name={`quiz-${contentId}`}
              value={option.id}
              checked={selected === option.id}
              onChange={() => {
                setSelected(option.id);
                setSubmitted(false);
              }}
            />
            <span className="option-letter">{String.fromCharCode(65 + i)}</span>
            <span>{option.text}</span>
            {selected === option.id && <Check size={17} />}
          </label>
        ))}
      </fieldset>
      <div className="quiz-actions">
        <button
          className="button-primary"
          disabled={!selected}
          onClick={() => {
            setSubmitted(true);
            setShow(true);
            if (trackCompletion && !sent.current) {
              AnalyticsService.track('lesson_complete', { content_id: contentId });
              sent.current = true;
            }
          }}
        >
          看看解析
          <ArrowRight size={16} />
        </button>
        <button className="quiet-button" onClick={() => setShow(!show)}>
          {show ? '收起解析' : '先閱讀解析'}
        </button>
        {submitted && (
          <button
            className="quiet-button"
            onClick={() => {
              setSubmitted(false);
              setShow(false);
              setSelected('');
            }}
          >
            <RotateCcw size={14} />
            再想一次
          </button>
        )}
      </div>
      <div aria-live="polite">
        {show && (
          <div className="quiz-feedback">
            <strong>
              {feedback ? (feedback.correct ? '有找到關鍵！' : '再多看一個線索。') : '一起看懂原因'}
            </strong>
            <p>
              {feedback?.explanation ??
                quiz.options.find((o) => o.id === quiz.correctOptionId)?.explanation}
            </p>
            <p className="muted">
              較有證據支持的回答：
              {feedback?.correctText ??
                quiz.options.find((o) => o.id === quiz.correctOptionId)?.text}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
