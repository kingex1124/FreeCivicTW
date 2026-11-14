'use client';
import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Landmark,
  Network,
  Users,
  ArrowDown,
  ScrollText,
} from 'lucide-react';
import { CivicService } from '@/Service/CivicService';
import { AnalyticsService } from '@/Service/AnalyticsService';
import { SourceList } from './SourceView';
import { AgencyDirectoryView, AgencyPicker, AgencyDetails } from './AgencyDirectoryView';
import { getScopedAgencyOptions, getAgencyInspection } from '@/Service/AgencyService';
import type { GovernmentProps, RoleDetailsProps, RelationFilter } from '@/Model/CivicModel';
export function RoleDetails({ role }: RoleDetailsProps) {
  return (
    <div className="role-details">
      <p className="role-summary">{role.summary}</p>
      <dl>
        <div>
          <dt>怎麼產生</dt>
          <dd>
            {role.selection}
            {[
              'legislator',
              'county-council',
              'town-council',
              'town-chief',
              'indigenous-chief',
              'indigenous-council',
            ].includes(role.id) && (
              <Link className="text-link" href="/more/#indigenous-guide">
                看原住民選舉與投票資格差異 <ArrowRight size={16} aria-hidden="true" />
              </Link>
            )}
          </dd>
        </div>
        <div>
          <dt>可以做什麼</dt>
          <dd>
            <ul>
              {role.powers.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </dd>
        </div>
        <div>
          <dt>有哪些界線</dt>
          <dd>
            <ul>
              {role.limits.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </dd>
        </div>
        <div>
          <dt>誰來監督</dt>
          <dd>{role.oversight}</dd>
        </div>
        {role.constituentServices && (
          <div>
            <dt>常見選民服務（協助方式）</dt>
            <dd>
              <ul>
                {role.constituentServices.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="service-boundary">{role.constituentServices.notice}</p>
            </dd>
          </div>
        )}
        <div>
          <dt>可以怎麼檢視表現</dt>
          <dd>
            <ul>
              {role.performanceChecks.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            {(role.id === 'people' || role.id === 'legislator') && (
              <Link className="text-link" href="/oversight/#org-ccw">
                用公督盟資料練習檢視立委表現
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            )}
          </dd>
        </div>
        <div>
          <dt>任命與程序</dt>
          <dd>{role.appointment}</dd>
        </div>
        <div>
          <dt>生活裡的例子</dt>
          <dd>{role.example}</dd>
        </div>
      </dl>
    </div>
  );
}
export function GovernmentView({ data, agencies, legislation, participation }: GovernmentProps) {
  const [scope, setScope] = useState<'central' | 'local'>('central');
  const [selected, setSelected] = useState('premier');
  const [selectedAgencyId, setSelectedAgencyId] = useState<string | null>(null);
  const [agencyPickerOpen, setAgencyPickerOpen] = useState(false);
  const agencyTriggerRef = useRef<HTMLButtonElement>(null);
  const roleAreaRef = useRef<HTMLDivElement>(null);
  const [localCollectionId, setLocalCollectionId] = useState('common');
  const inspectorRef = useRef<HTMLElement>(null);
  const [kind, setKind] = useState<RelationFilter>('all');
  const [flowId, setFlowId] = useState('appointment');
  const [step, setStep] = useState(0);
  const [allSteps, setAllSteps] = useState(false);
  const role = data.roles.find((r) => r.id === selected) ?? data.roles[0];
  const relations = CivicService.related(data, role.id, kind, scope);
  const agencyOptions = getScopedAgencyOptions(agencies, scope, localCollectionId);
  const selectedAgency = agencyOptions.find((option) => option.id === selectedAgencyId);
  const inspection = selectedAgency ? getAgencyInspection(agencies, selectedAgency) : undefined;
  const flow = data.flows.find((f) => f.id === flowId) ?? data.flows[0];
  const closeAgencyPicker = useCallback(() => {
    setAgencyPickerOpen(false);
    requestAnimationFrame(() => agencyTriggerRef.current?.focus());
  }, []);
  const openAgencyPicker = useCallback(() => {
    setAgencyPickerOpen(true);
    requestAnimationFrame(() => {
      const area = roleAreaRef.current;
      if (!area) return;
      const headerHeight = document.querySelector('header')?.getBoundingClientRect().height ?? 90;
      const board = area.closest('.government-board') ?? area;
      window.scrollTo({
        top: Math.max(0, board.getBoundingClientRect().top + window.scrollY - headerHeight - 16),
        behavior: 'instant',
      });
    });
  }, []);
  function revealInspector() {
    requestAnimationFrame(() => {
      const inspector = inspectorRef.current;
      if (!inspector) return;
      inspector.scrollTop = 0;
      if (window.matchMedia('(max-width: 1100px)').matches) {
        const reduced =
          document.documentElement.dataset.motion === 'reduced' ||
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        inspector.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
      }
    });
  }
  return (
    <div className="container section-bottom">
      <nav className="government-jumps" aria-label="政府教學段落">
        <a href="#agency-directory">中央、地方機關在做什麼？</a>
        <a href="#appointments">誰任命部長、局處長？</a>
        <a href="#questioning">誰質詢、誰備詢？</a>
        <a href="#integrity">政風處、政風室在做什麼？</a>
      </nav>
      <div className="government-workspace">
        <div className="government-board">
          <div className="scope-switch" aria-label="政府範圍">
            <button
              aria-pressed={scope === 'central'}
              onClick={() => {
                setScope('central');
                setSelected('premier');
                setSelectedAgencyId(null);
                setAgencyPickerOpen(false);
              }}
            >
              中央政府
            </button>
            <button
              aria-pressed={scope === 'local'}
              onClick={() => {
                setScope('local');
                setSelected('county-chief');
                setSelectedAgencyId(null);
                setAgencyPickerOpen(false);
              }}
            >
              地方政府
            </button>
          </div>
          <div className="role-selection-area" id="government-agency-picker" ref={roleAreaRef}>
            <div className="board-caption">
              <Network size={17} />
              <p>點一個角色，看看它的權力從哪裡來。</p>
            </div>
            <div className={`role-grid scope-${scope}`} inert={agencyPickerOpen}>
              {CivicService.forScope(data, scope).map((r) => (
                <button
                  key={r.id}
                  className={`role-node category-${r.category} ${r.id === 'people' ? 'role-people' : ''} ${r.id === selected && !inspection ? 'selected' : ''}`}
                  aria-pressed={r.id === selected && !inspection}
                  onClick={() => {
                    setSelected(r.id);
                    setSelectedAgencyId(null);
                    revealInspector();
                    AnalyticsService.track('role_card_open', { content_id: r.id });
                  }}
                >
                  {r.id === 'people' ? <Users size={23} /> : <Landmark size={22} />}
                  <strong>{r.name}</strong>
                  <span>
                    {r.category === 'executive'
                      ? '行政與執行'
                      : r.category === 'representative'
                        ? '民意與監督'
                        : '制度中的角色'}
                  </span>
                </button>
              ))}
              <button
                ref={agencyTriggerRef}
                type="button"
                className={`role-node agency-picker-trigger ${inspection || agencyPickerOpen ? 'selected' : ''}`}
                aria-haspopup="dialog"
                aria-expanded={agencyPickerOpen}
                aria-controls="agency-picker-dialog"
                onClick={openAgencyPicker}
              >
                <Landmark size={22} aria-hidden="true" />
                <strong>{scope === 'central' ? '各部會與中央機關' : '各局處與地方單位'}</strong>
                <span>選擇機關 · {agencyOptions.length} 個單位</span>
              </button>
            </div>
            <AgencyPicker
              key={scope}
              open={agencyPickerOpen}
              onClose={closeAgencyPicker}
              scope={scope}
              options={agencyOptions}
              selectedId={selectedAgencyId}
              collectionId={localCollectionId}
              collections={agencies.localInventories.map(({ id, name }) => ({ id, name }))}
              onCollectionChange={(id) => {
                setLocalCollectionId(id);
                setSelectedAgencyId(null);
              }}
              onSelect={(id) => {
                setSelectedAgencyId(id);
                revealInspector();
              }}
            />
            <noscript>
              <a className="text-link" href="#agency-directory">
                前往機關總覽，逐項閱讀完整說明
              </a>
            </noscript>
          </div>
          {inspection ? (
            <div className="relationship-panel agency-selection-note">
              <h3>目前查看：{inspection.name}</h3>
              <p>{inspection.context}</p>
              <p className="board-note">
                說明面板會顯示此單位的工作、權限與生活關聯。也可點回上方角色，查看任用及監督關係。
              </p>
              <button
                type="button"
                className="quiet-button"
                onClick={() => {
                  setSelectedAgencyId(null);
                  revealInspector();
                }}
              >
                回到「{role.name}」的角色關係
              </button>
            </div>
          ) : (
            <div className="relationship-panel">
              <h3>與「{role.name}」的關係</h3>
              <label className="field-label" htmlFor="relation-kind">
                選擇關係種類
              </label>
              <select
                id="relation-kind"
                value={kind}
                onChange={(e) => setKind(e.target.value as RelationFilter)}
              >
                <option value="all">全部關係</option>
                <option value="election">選舉</option>
                <option value="appointment">任命／提請任命</option>
                <option value="consent">提名／同意</option>
                <option value="oversight">依法監督</option>
                <option value="execution">業務執行</option>
              </select>
              <ul className="relation-list">
                {relations.map((r, i) => (
                  <li key={i}>
                    <div className="relation-line">
                      <span>{r.fromName}</span>
                      <span className="relation-arrow">
                        <small>{r.label}</small>
                        <ArrowRight size={20} />
                      </span>
                      <span>{r.toName}</span>
                    </div>
                    {r.officeCatalog && (
                      <details className="relation-offices">
                        <summary>{r.officeCatalog.relationSummary}</summary>
                        <p>{r.officeCatalog.procedure}</p>
                        <p className="muted">{r.officeCatalog.coverage}</p>
                        <ul className="office-list">
                          {r.offices.map((office) => (
                            <li key={office.id}>{office.title}</li>
                          ))}
                        </ul>
                        <ul>
                          {r.officeCatalog.notes.map((note) => (
                            <li key={note}>{note}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </li>
                ))}
              </ul>
              {relations.length === 0 && (
                <p className="muted">目前所選關係沒有對應連線，請切換其他種類。</p>
              )}
              <p className="board-note">不同連線代表不同法定關係，不能一律當成命令或上下隸屬。</p>
              {scope === 'central' && (kind === 'consent' || kind === 'appointment') && (
                <p className="board-note">
                  大法官的人事程序：總統提名 → 立法院同意 →
                  總統任命。「提名／同意」與「任命」分別顯示各步驟，不代表可略過其他程序。
                </p>
              )}
            </div>
          )}
        </div>
        <section className="role-inspector" aria-live="polite" ref={inspectorRef}>
          <span className="eyebrow">{inspection ? '機關筆記' : '角色筆記'}</span>
          <h2>{inspection?.name ?? role.name}</h2>
          {inspection ? (
            <>
              <a
                className="text-link inspector-back-link"
                href="#government-agency-picker"
                onClick={(event) => {
                  event.preventDefault();
                  openAgencyPicker();
                }}
              >
                選擇其他機關
              </a>
              <AgencyDetails inspection={inspection} />
            </>
          ) : (
            <>
              <RoleDetails role={role} />
              <SourceList sourceIds={role.sourceIds} compact />
            </>
          )}
          <a
            className="section-return mobile-section-return"
            href="#government-agency-picker"
            onClick={() => setAgencyPickerOpen(false)}
          >
            ↑ 回到角色與機關選擇
          </a>
        </section>
      </div>
      <div className="government-reading-layout">
        <nav
          className="more-topic-nav government-topic-nav"
          id="government-topics"
          aria-label="政府內容導覽"
        >
          <h2>想了解哪一段？</h2>
          <p>從機關職責開始，選一段慢慢看。</p>
          <div>
            {[
              ['agency-directory', '機關職責', '中央與地方的單位在做什麼'],
              ['government-procedures', '制度流程', '任命、法律與預算的簡圖'],
              ['appointments', '人事任命', '誰任命部長、局處長'],
              ['national-legislation', '立法院立法', '中央提案、三讀、覆議與公布'],
              ['local-legislation', '議會立法', '地方三讀、覆議、核定與施行'],
              ['questioning', '質詢與備詢', '誰在問、誰來回答'],
              ['integrity', '政風與監督', '廉政、調查與監督的分工'],
              ['referendum', '公投', '全國與地方，對事情作決定'],
              ['recall', '罷免', '對人的去留作決定，先看職務'],
              ['government-situations', '生活情境', '遇到問題，先找哪些線索'],
              ['government-all-roles', '所有角色', '逐項閱讀職掌與權力界線'],
            ].map(([id, title, description]) => (
              <a key={id} href={`#${id}`}>
                <span>
                  <strong>{title}</strong>
                  <span>{description}</span>
                </span>
                <ArrowDown size={18} aria-hidden="true" />
              </a>
            ))}
          </div>
        </nav>
        <div className="government-reading-content">
          <AgencyDirectoryView data={agencies} />
          <a className="section-return mobile-section-return" href="#government-topics">
            ↑ 回到目錄
          </a>
          <section
            className="section-space"
            id="government-procedures"
            aria-labelledby="government-procedures-title"
          >
            <div className="section-heading">
              <div>
                <div className="eyebrow">一步一步看懂程序</div>
                <h2 id="government-procedures-title">權力不是一條直線。</h2>
                <p>先看一般的教學路徑，再留意條件與例外。</p>
              </div>
            </div>
            <div className="flow-tabs">
              {data.flows.map((f) => (
                <button
                  key={f.id}
                  aria-pressed={flowId === f.id}
                  onClick={() => {
                    setFlowId(f.id);
                    setStep(0);
                  }}
                >
                  {f.title}
                </button>
              ))}
            </div>
            <div className="flow-box">
              <div className="flow-progress" aria-label="流程進度">
                {flow.steps.map((s, i) => (
                  <button
                    key={i}
                    aria-current={i === step ? 'step' : undefined}
                    onClick={() => setStep(i)}
                  >
                    <span>{i + 1}</span>
                    <strong>{s.title}</strong>
                  </button>
                ))}
              </div>
              <div className="flow-current" aria-live="polite">
                <span className="pill">{flow.steps[step].actor}</span>
                <h3>{flow.steps[step].title}</h3>
                <p>{flow.steps[step].text}</p>
              </div>
              <div className="flow-controls">
                <button
                  className="button-secondary"
                  disabled={step === 0}
                  onClick={() => setStep(step - 1)}
                >
                  <ArrowLeft size={16} />
                  上一步
                </button>
                <button className="quiet-button" onClick={() => setStep(0)}>
                  <RotateCcw size={15} />
                  重來
                </button>
                <button
                  className="button-primary"
                  disabled={step === flow.steps.length - 1}
                  onClick={() => setStep(step + 1)}
                >
                  下一步
                  <ArrowRight size={16} />
                </button>
              </div>
              <p className="board-note">{flow.notice}</p>
              {flowId === 'law' && (
                <a className="text-link" href="#national-legislation">
                  閱讀完整立法、覆議、公布生效與憲法審查程序{' '}
                  <ArrowRight size={18} aria-hidden="true" />
                </a>
              )}
              <button
                className="text-link"
                aria-expanded={allSteps}
                onClick={() => setAllSteps(!allSteps)}
              >
                {allSteps ? '收起全部步驟' : '直接閱讀全部步驟'}
              </button>
              {allSteps && (
                <ol className="full-flow">
                  {flow.steps.map((s, i) => (
                    <li key={i}>
                      <h4>
                        {s.title} · {s.actor}
                      </h4>
                      <p>{s.text}</p>
                    </li>
                  ))}
                </ol>
              )}
              <noscript>
                <ol>
                  {data.flows.flatMap((f) =>
                    f.steps.map((s, i) => (
                      <li key={`${f.id}-${i}`}>
                        {f.title}／{s.title}：{s.text}
                      </li>
                    )),
                  )}
                </ol>
              </noscript>
            </div>
            <a className="section-return mobile-section-return" href="#government-topics">
              ↑ 回到目錄
            </a>
          </section>
          <section className="section-space" id="appointments" aria-labelledby="appointments-title">
            <div className="section-heading">
              <div>
                <div className="eyebrow">把任命程序拆開看</div>
                <h2 id="appointments-title">部長、局處長，是誰任命的？</h2>
                <p>先看職務，再看提請、任命與任用資格。以下列出職稱，幫你讀懂人事新聞。</p>
              </div>
            </div>
            <div className="appointment-catalogs">
              {data.appointmentCatalogs.map((catalog) => (
                <article className="appointment-catalog" key={catalog.id} id={catalog.id}>
                  <h3>{catalog.title}</h3>
                  <p className="appointment-procedure">{catalog.procedure}</p>
                  <p className="muted">{catalog.coverage}</p>
                  <details open={catalog.id === 'central-ministers'}>
                    <summary>查看 {catalog.offices.length} 項職務</summary>
                    <ul className="office-list">
                      {catalog.offices.map((office) => (
                        <li key={office.id}>{office.title}</li>
                      ))}
                    </ul>
                  </details>
                  <ul className="appointment-notes">
                    {catalog.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                  <SourceList sourceIds={catalog.sourceIds} compact />
                </article>
              ))}
            </div>
            <p className="board-note">
              本次任命與質詢資料查核：{data.checkedAt}
              。地方職務以各縣市組織自治條例、編制表及適用人事法規為準。
            </p>
            <a className="section-return mobile-section-return" href="#government-topics">
              ↑ 回到目錄
            </a>
          </section>
          <section
            className="section-space"
            id="government-legislation"
            aria-labelledby="government-legislation-title"
          >
            <div className="section-heading">
              <div>
                <div className="eyebrow">從草案到正式實施</div>
                <h2 id="government-legislation-title">法律與自治條例，是怎麼制定的？</h2>
                <p>
                  往下選擇中央或地方，直接在本頁閱讀議事角色、三讀、復議與覆議、公布、生效，以及憲法審查。
                </p>
              </div>
            </div>
            <div className="government-legislation-links">
              <a href="#national-legislation">
                <ScrollText size={24} aria-hidden="true" />
                <span>
                  <strong>立法院立法</strong>
                  <span>程序委員會、召委、院長，到行政院覆議與總統公布。</span>
                </span>
                <ArrowRight size={20} aria-hidden="true" />
              </a>
              <a href="#local-legislation">
                <Landmark size={24} aria-hidden="true" />
                <span>
                  <strong>地方議會立法</strong>
                  <span>議長、委員會、地方覆議，到核定、公布及實施。</span>
                </span>
                <ArrowRight size={20} aria-hidden="true" />
              </a>
            </div>
            {legislation}
          </section>
          <section className="section-space" id="questioning" aria-labelledby="questioning-title">
            <div className="section-heading">
              <div>
                <div className="eyebrow">看懂新聞裡的質詢畫面</div>
                <h2 id="questioning-title">誰在問？誰來回答？</h2>
                <p>{data.questioning.intro}</p>
              </div>
            </div>
            <div className="questioning-table-wrap">
              <table className="questioning-table" role="table">
                <caption>各層級質詢與備詢對照</caption>
                <thead>
                  <tr>
                    <th scope="col">在哪裡</th>
                    <th scope="col">質詢的人</th>
                    <th scope="col">備詢的人與業務</th>
                  </tr>
                </thead>
                <tbody>
                  {data.questioning.venues.map((venue) => (
                    <tr key={venue.id}>
                      <th scope="row">{venue.title}</th>
                      <td>
                        <span className="mobile-cell-label" aria-hidden="true">
                          質詢的人
                        </span>
                        {venue.questioner}
                      </td>
                      <td>
                        <span className="mobile-cell-label" aria-hidden="true">
                          備詢的人與業務
                        </span>
                        <strong>{venue.respondents}</strong>
                        <p>{venue.scope}</p>
                        <p className="questioning-example">虛構例子：{venue.example}</p>
                        <SourceList sourceIds={venue.sourceIds} compact />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="questioning-notes">
              {data.questioning.notes.map((note) => (
                <article key={note.title}>
                  <h3>{note.title}</h3>
                  <p>{note.text}</p>
                  <SourceList sourceIds={note.sourceIds} compact />
                </article>
              ))}
            </div>
            <a className="section-return mobile-section-return" href="#government-topics">
              ↑ 回到目錄
            </a>
          </section>
          <section className="section-space" id="integrity" aria-labelledby="integrity-title">
            <div className="section-heading">
              <div>
                <div className="eyebrow">把廉政與監督分工看清楚</div>
                <h2 id="integrity-title">{data.integrityGuide.title}</h2>
                <p>{data.integrityGuide.intro}</p>
              </div>
            </div>
            <details className="integrity-explainer">
              <summary>展開政風與監督制度補充說明</summary>
              <div className="integrity-points">
                {data.integrityGuide.points.map((point) => (
                  <article key={point.title}>
                    <h3>{point.title}</h3>
                    <p>{point.text}</p>
                  </article>
                ))}
              </div>
              <div className="oversight-comparison">
                {data.integrityGuide.comparisons.map((unit) => (
                  <article key={unit.name}>
                    <h3>{unit.name}</h3>
                    <dl>
                      <div>
                        <dt>主要工作</dt>
                        <dd>{unit.work}</dd>
                      </div>
                      <div>
                        <dt>權限界線</dt>
                        <dd>{unit.boundary}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
              <article className="integrity-reporting">
                <h3>{data.integrityGuide.reporting.title}</h3>
                <ol>
                  {data.integrityGuide.reporting.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                <a
                  className="text-link"
                  href={data.integrityGuide.reporting.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {data.integrityGuide.reporting.label}
                  <ArrowRight size={16} />
                </a>
              </article>
              <SourceList sourceIds={data.integrityGuide.sourceIds} compact />
            </details>
            <a className="section-return mobile-section-return" href="#government-topics">
              ↑ 回到目錄
            </a>
          </section>
          <div className="participation-topics">{participation}</div>
          <section
            className="section-space"
            id="government-situations"
            aria-labelledby="government-situations-title"
          >
            <div className="section-heading">
              <div>
                <div className="eyebrow">連回你的日常</div>
                <h2 id="government-situations-title">碰到生活問題，可以先問什麼？</h2>
              </div>
            </div>
            <div className="situation-grid">
              {data.situations.map((s, i) => (
                <article key={s.id}>
                  <span className="eyebrow">虛構情境 0{i + 1}</span>
                  <h3>{s.title}</h3>
                  <p>{s.question}</p>
                  <details>
                    <summary>一起找線索</summary>
                    <p>{s.answer}</p>
                    <ol>
                      {s.steps.map((step, j) => (
                        <li key={j}>{step}</li>
                      ))}
                    </ol>
                  </details>
                </article>
              ))}
            </div>
            <a className="section-return mobile-section-return" href="#government-topics">
              ↑ 回到目錄
            </a>
          </section>
          <details className="all-roles" id="government-all-roles">
            <summary>閱讀所有角色的文字說明</summary>
            {data.roles.map((r) => (
              <section key={r.id}>
                <h3>{r.name}</h3>
                <RoleDetails role={r} />
              </section>
            ))}
          </details>
          <a className="section-return mobile-section-return" href="#government-topics">
            ↑ 回到目錄
          </a>
        </div>
      </div>
    </div>
  );
}
