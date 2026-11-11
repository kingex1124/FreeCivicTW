'use client';
import { useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Gavel,
  Search,
  ShieldCheck,
  Scale,
  RotateCcw,
} from 'lucide-react';
import { JusticeService } from '@/Service/JusticeService';
import { AnalyticsService } from '@/Service/AnalyticsService';
import { SourceList } from './SourceView';
import type { JusticeDetailsProps, JusticeFilter, JusticeViewProps } from '@/Model/JusticeModel';
import type { SourceListProps } from '@/Model/SourceModel';

function JusticeSources({ sourceIds, headingLevel = 'h3' }: SourceListProps) {
  return (
    <details className="justice-sources">
      <summary>查看官方依據</summary>
      <SourceList sourceIds={sourceIds} compact headingLevel={headingLevel} />
    </details>
  );
}

export function JusticeDetails({ entity }: JusticeDetailsProps) {
  return (
    <div className="justice-entity-details">
      <p className="role-summary">{entity.summary}</p>
      <dl>
        <div>
          <dt>在體系中的位置</dt>
          <dd>{entity.position}</dd>
        </div>
        <div>
          <dt>可以做什麼</dt>
          <dd>
            <ul>
              {entity.duties.map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ul>
          </dd>
        </div>
        <div>
          <dt>有哪些界線</dt>
          <dd>
            <ul>
              {entity.limits.map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ul>
          </dd>
        </div>
        <div>
          <dt>生活裡的例子</dt>
          <dd>{entity.example}</dd>
        </div>
      </dl>
      <a className="text-link" href={entity.officialUrl} target="_blank" rel="noopener noreferrer">
        前往官方說明 <ExternalLink size={15} />
      </a>
      <JusticeSources sourceIds={entity.sourceIds} headingLevel="h4" />
    </div>
  );
}

export function JusticeView({ data }: JusticeViewProps) {
  const [group, setGroup] = useState<JusticeFilter['group']>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('judicial-yuan');
  const [step, setStep] = useState(0);
  const directoryRef = useRef<HTMLElement>(null);
  const inspectorRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const options = JusticeService.filter(data, { group, query });
  const selected = options.find((item) => item.id === selectedId) ?? options[0];
  const currentStep = data.criminalFlow.steps[step];
  function reveal(target: HTMLElement | null) {
    if (!target) return;
    const reduced =
      document.documentElement.dataset.motion === 'reduced' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ block: 'start', behavior: reduced ? 'instant' : 'smooth' });
  }
  function chooseGroup(next: JusticeFilter['group']) {
    setGroup(next);
    setQuery('');
    setSelectedId('');
  }
  return (
    <div className="container section-bottom justice-page">
      <nav className="government-jumps" aria-label="司法教學段落">
        <a href="#justice-organization">三個體系怎麼分？</a>
        <a href="#justice-directory">機關與角色在做什麼？</a>
        <a href="#justice-courts">法院分哪些種類？</a>
        <a href="#justice-process">刑事案件怎麼走？</a>
        <a href="#justice-reporting">報案與按鈴申告</a>
      </nav>

      <section className="justice-principles" aria-labelledby="justice-principles-title">
        <h2 id="justice-principles-title">先記住這三件事。</h2>
        <div className="justice-principle-grid">
          {data.principles.map((item, index) => (
            <article key={item.id}>
              <span className="justice-index">0{index + 1}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <JusticeSources sourceIds={item.sourceIds} headingLevel="h4" />
            </article>
          ))}
        </div>
      </section>

      <section
        className="section-space"
        id="justice-organization"
        aria-labelledby="justice-organization-title"
      >
        <div className="section-heading">
          <div>
            <div className="eyebrow">先看組織，再看權力界線</div>
            <h2 id="justice-organization-title">法院、檢察、警察，各有位置。</h2>
            <p>下面是分工導覽。組織上的管理關係，不能直接當成對每個案件的指揮權。</p>
          </div>
        </div>
        <div className="justice-system-grid">
          {data.groups
            .filter((item) => item.id !== 'support')
            .map((item) => (
              <article key={item.id} className={`justice-system-card justice-system-${item.id}`}>
                <div className="justice-system-icon" aria-hidden="true">
                  {item.id === 'courts' ? (
                    <Scale size={26} />
                  ) : item.id === 'prosecution' ? (
                    <Gavel size={26} />
                  ) : (
                    <ShieldCheck size={26} />
                  )}
                </div>
                <h3>{item.title}</h3>
                <ol className="justice-organization-path">
                  {item.organizationPath.map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ol>
                <p>{item.note}</p>
                <button
                  type="button"
                  className="text-link"
                  onClick={() => {
                    chooseGroup(item.id);
                    requestAnimationFrame(() => reveal(directoryRef.current));
                  }}
                >
                  認識{item.label} <ArrowRight size={16} />
                </button>
              </article>
            ))}
        </div>
        <div className="justice-cooperation">
          <Scale size={24} aria-hidden="true" />
          <p>{data.cooperation.text}</p>
        </div>
        <JusticeSources
          sourceIds={[
            ...new Set([
              ...data.groups.flatMap((item) => item.sourceIds),
              ...data.cooperation.sourceIds,
            ]),
          ]}
        />
      </section>

      <section id="justice-directory" ref={directoryRef} aria-labelledby="justice-directory-title">
        <div className="section-heading">
          <div>
            <div className="eyebrow">一個一個看懂工作與界線</div>
            <h2 id="justice-directory-title">這個機關、這個角色，負責什麼？</h2>
            <p>選一張卡片，查看職責、生活關聯與官方來源。</p>
          </div>
        </div>
        <div className="justice-directory-tools">
          <div className="justice-group-filters" role="group" aria-label="司法機關分類">
            <button type="button" aria-pressed={group === 'all'} onClick={() => chooseGroup('all')}>
              全部
            </button>
            {data.groups.map((item) => (
              <button
                type="button"
                key={item.id}
                aria-pressed={group === item.id}
                onClick={() => chooseGroup(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <label className="justice-search">
            <Search size={18} aria-hidden="true" />
            <span className="sr-only">搜尋司法機關、角色與工作</span>
            <input
              ref={searchRef}
              type="search"
              value={query}
              placeholder="例如：法官、羈押、調查局"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <p className="muted" role="status">
            顯示 {options.length}／{data.entities.length} 項機關與角色
          </p>
          <p className="muted">卡片區可向下捲動，也可先選分類或搜尋找單位。</p>
        </div>
        <div className="justice-workspace">
          <div className="justice-entity-grid" aria-label="機關與角色選擇">
            {options.map((item) => (
              <button
                type="button"
                className="justice-entity-card"
                key={item.id}
                aria-label={`查看${item.name}`}
                aria-pressed={selected?.id === item.id}
                onClick={() => {
                  setSelectedId(item.id);
                  AnalyticsService.track('role_card_open', { content_id: `justice-${item.id}` });
                  requestAnimationFrame(() => {
                    if (inspectorRef.current) inspectorRef.current.scrollTop = 0;
                    if (window.matchMedia('(max-width: 1000px)').matches)
                      reveal(inspectorRef.current);
                  });
                }}
              >
                {item.group === 'courts' ? (
                  <Scale size={22} aria-hidden="true" />
                ) : item.group === 'police' ? (
                  <ShieldCheck size={22} aria-hidden="true" />
                ) : (
                  <Gavel size={22} aria-hidden="true" />
                )}
                <strong>{item.name}</strong>
                <span>{item.kind}</span>
              </button>
            ))}
            {!options.length && (
              <div className="justice-empty">
                <p>目前沒有符合條件的機關或角色。</p>
                <button className="button-secondary" onClick={() => chooseGroup('all')}>
                  清除條件
                </button>
              </div>
            )}
          </div>
          <section
            className="justice-inspector"
            ref={inspectorRef}
            aria-labelledby="justice-selected-title"
            aria-live="polite"
          >
            <span className="eyebrow">司法與警檢筆記</span>
            <h3 id="justice-selected-title">{selected?.name ?? '換個關鍵字試試看'}</h3>
            <button
              type="button"
              className="quiet-button justice-return"
              onClick={() => {
                reveal(directoryRef.current);
                searchRef.current?.focus({ preventScroll: true });
              }}
            >
              <ArrowLeft size={15} aria-hidden="true" />
              回到機關與角色選擇
            </button>
            {selected ? (
              <JusticeDetails entity={selected} />
            ) : (
              <p>可搜尋機關名稱、角色或工作，例如「檢察官」與「報案」。</p>
            )}
          </section>
        </div>
        <noscript>
          <p className="notice">未啟用 JavaScript 時，可使用下方「完整機關與角色說明」逐項閱讀。</p>
        </noscript>
        <details className="justice-full-text" id="justice-full-text">
          <summary>完整機關與角色說明（{data.entities.length} 項，免搜尋也能全部閱讀）</summary>
          {data.entities.map((entity) => (
            <section key={entity.id} id={`justice-full-${entity.id}`}>
              <h3>{entity.name}</h3>
              <JusticeDetails entity={entity} />
            </section>
          ))}
        </details>
        <ul className="justice-coverage-notes">
          {data.coverageNotes.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ul>
      </section>

      <section className="section-space" id="justice-courts" aria-labelledby="justice-courts-title">
        <div className="section-heading">
          <div>
            <div className="eyebrow">法院種類與審級</div>
            <h2 id="justice-courts-title">不同的爭議，走不同的審判路徑。</h2>
            <p>法院的級別、案件的審級與上訴次數，是三件要分清楚的事。</p>
          </div>
        </div>
        <div className="justice-court-paths">
          {data.courtPaths.map((item) => (
            <article key={item.id}>
              <h3>{item.title}</h3>
              <ul>
                {item.stages.map((stage) => (
                  <li key={stage}>{stage}</li>
                ))}
              </ul>
              <p>{item.note}</p>
              <JusticeSources sourceIds={item.sourceIds} headingLevel="h4" />
            </article>
          ))}
        </div>
      </section>

      <section id="justice-process" aria-labelledby="justice-process-title">
        <div className="section-heading">
          <div>
            <div className="eyebrow">用刑事公訴案件當例子</div>
            <h2 id="justice-process-title">{data.criminalFlow.title}</h2>
            <p>{data.criminalFlow.intro}</p>
          </div>
        </div>
        <div className="justice-flow-box">
          <ol className="justice-flow-progress" aria-label="刑事公訴程序步驟">
            {data.criminalFlow.steps.map((item, index) => (
              <li key={item.id}>
                <button
                  type="button"
                  aria-current={step === index ? 'step' : undefined}
                  onClick={() => setStep(index)}
                >
                  <span>{index + 1}</span>
                  {item.title}
                </button>
              </li>
            ))}
          </ol>
          <div className="justice-current-step" aria-live="polite">
            <span className="pill">{currentStep.actor}</span>
            <h3>{currentStep.title}</h3>
            <p>{currentStep.text}</p>
            <ul>
              {currentStep.details.map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ul>
            {currentStep.outcomes && (
              <div className="justice-outcomes">
                {currentStep.outcomes.map((outcome) => (
                  <article key={outcome.label}>
                    <h4>{outcome.label}</h4>
                    <p>{outcome.text}</p>
                  </article>
                ))}
              </div>
            )}
            <JusticeSources sourceIds={currentStep.sourceIds} headingLevel="h4" />
          </div>
          <div className="flow-controls">
            <button
              type="button"
              className="button-secondary"
              disabled={step === 0}
              onClick={() => setStep(step - 1)}
            >
              <ArrowLeft size={16} />
              上一步
            </button>
            <button type="button" className="quiet-button" onClick={() => setStep(0)}>
              <RotateCcw size={15} />
              重來
            </button>
            <button
              type="button"
              className="button-primary"
              disabled={step === data.criminalFlow.steps.length - 1}
              onClick={() => setStep(step + 1)}
            >
              下一步
              <ArrowRight size={16} />
            </button>
          </div>
          <ul className="justice-flow-notes">
            {data.criminalFlow.notes.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
          <details className="justice-full-flow">
            <summary>直接閱讀所有流程與分支</summary>
            <ol>
              {data.criminalFlow.steps.map((item) => (
                <li key={item.id}>
                  <h3>
                    {item.title} · {item.actor}
                  </h3>
                  <p>{item.text}</p>
                  <ul>
                    {item.details.map((text) => (
                      <li key={text}>{text}</li>
                    ))}
                  </ul>
                  {item.outcomes?.map((outcome) => (
                    <p key={outcome.label}>
                      <strong>{outcome.label}：</strong>
                      {outcome.text}
                    </p>
                  ))}
                  <JusticeSources sourceIds={item.sourceIds} headingLevel="h4" />
                </li>
              ))}
            </ol>
          </details>
        </div>
      </section>

      <section
        className="section-space"
        id="justice-reporting"
        aria-labelledby="justice-reporting-title"
      >
        <div className="section-heading">
          <div>
            <div className="eyebrow">不把報案與申告想得太神祕</div>
            <h2 id="justice-reporting-title">警察局報案、地檢署申告，怎麼分？</h2>
            <p>{data.reporting.intro}</p>
          </div>
        </div>
        <div className="justice-reporting-terms">
          {data.reporting.terms.map((item) => (
            <article key={item.id}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <JusticeSources sourceIds={item.sourceIds} headingLevel="h4" />
            </article>
          ))}
        </div>
        <div className="justice-reporting-channels">
          {data.reporting.channels.map((channel) => (
            <article key={channel.id}>
              <h3>{channel.title}</h3>
              <p className="justice-channel-where">{channel.where}</p>
              <ol>
                {channel.steps.map((item) => (
                  <li key={item.title}>
                    <h4>{item.title}</h4>
                    <p>{item.text}</p>
                  </li>
                ))}
              </ol>
              <ul>
                {channel.notes.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
              <a
                className="text-link"
                href={channel.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                官方窗口說明
                <ExternalLink size={15} />
              </a>
              <JusticeSources sourceIds={channel.sourceIds} headingLevel="h4" />
            </article>
          ))}
        </div>
        <div className="justice-prepare">
          <h3>先整理這些資訊，有助於說清楚。</h3>
          <ul>
            {data.reporting.prepare.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
          <p>{data.reporting.notice}</p>
          <JusticeSources sourceIds={data.reporting.sourceIds} headingLevel="h4" />
        </div>
      </section>

      <section aria-labelledby="justice-faq-title" className="justice-faq">
        <div className="section-heading">
          <div>
            <div className="eyebrow">看司法新聞時，再多問一步</div>
            <h2 id="justice-faq-title">容易混淆的幾件事。</h2>
          </div>
        </div>
        {data.faq.map((item) => (
          <details key={item.id}>
            <summary>{item.title}</summary>
            <p>{item.text}</p>
            <JusticeSources sourceIds={item.sourceIds} />
          </details>
        ))}
      </section>
      <p className="justice-checked-at">
        資料查核：{data.checkedAt}
        。本頁介紹制度與一般程序；個案的管轄、資格、期間及法律協助，請依官方窗口與適用法規確認。
      </p>
    </div>
  );
}
