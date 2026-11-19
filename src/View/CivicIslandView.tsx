'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Compass,
  Search,
  Route,
  RotateCcw,
  Plus,
  Minus,
  Scan,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ExternalLink,
  X,
} from 'lucide-react';
import type {
  IslandNoteProps,
  IslandViewProps,
  IslandGroupId,
  IslandCameraCommand,
} from '@/Model/IslandModel';
import { IslandService } from '@/Service/IslandService';
import { SourceList } from './SourceView';
const Scene = dynamic(() => import('./CivicIslandSceneView'), { ssr: false });
function IslandNote({ node }: IslandNoteProps) {
  return (
    <>
      <p className="island-note-summary">{node.summary}</p>
      <dl className="island-note-sections">
        <div>
          <dt>這個角色／機關的定位</dt>
          <dd>{node.context}</dd>
        </div>
        <div>
          <dt>主要可以做什麼？</dt>
          <dd>
            <ul>
              {node.duties.map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ul>
          </dd>
        </div>
        {node.life.length > 0 && (
          <div>
            <dt>生活裡，可以留意什麼？</dt>
            <dd>
              <ul>
                {node.life.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            </dd>
          </div>
        )}
        <div>
          <dt>有哪些權力界線？</dt>
          <dd>
            <ul>
              {node.limits.map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ul>
          </dd>
        </div>
        <div>
          <dt>用一個教學例子理解</dt>
          <dd>{node.example}</dd>
        </div>
      </dl>
      <SourceList sourceIds={node.sourceIds} compact headingLevel="h4" />
      <Link className="text-link island-original" href={node.href}>
        到原頁繼續了解 <ExternalLink size={17} aria-hidden="true" />
      </Link>
    </>
  );
}
export function CivicIslandView({ data }: IslandViewProps) {
  const [group, setGroup] = useState<IslandGroupId | 'all'>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('central-role-people');
  const [noteOpen, setNoteOpen] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(true);
  const [journeysOpen, setJourneysOpen] = useState(false);
  const [journeyId, setJourneyId] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [showConnections, setShowConnections] = useState(true);
  const [generation, setGeneration] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  const [command, setCommand] = useState<IslandCameraCommand>({ kind: 'reset', sequence: 0 });
  const noteRef = useRef<HTMLElement>(null);
  const noteScrollRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const homeRef = useRef<HTMLButtonElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const journeyPanelRef = useRef<HTMLElement>(null);
  const journeyScrollRef = useRef<HTMLDivElement>(null);
  const journeyToggleRef = useRef<HTMLButtonElement>(null);
  const journeyDetailsRef = useRef<HTMLButtonElement>(null);
  const directorySearchRef = useRef<HTMLInputElement>(null);
  const directoryPanelRef = useRef<HTMLElement>(null);
  const directoryToggleRef = useRef<HTMLButtonElement>(null);
  const closeJourneys = useCallback(() => {
    setJourneysOpen(false);
    requestAnimationFrame(() =>
      (journeyDetailsRef.current ?? journeyToggleRef.current)?.focus({ preventScroll: true }),
    );
  }, []);
  const closeDirectory = useCallback(() => {
    setPanelCollapsed(true);
    requestAnimationFrame(() => directoryToggleRef.current?.focus({ preventScroll: true }));
  }, []);
  function openJourneys() {
    setNoteOpen(false);
    setPanelCollapsed(true);
    setJourneysOpen(true);
  }
  function openDirectory() {
    setJourneysOpen(false);
    setNoteOpen(false);
    setPanelCollapsed(false);
    requestAnimationFrame(() => {
      if (directoryPanelRef.current) directoryPanelRef.current.scrollTop = 0;
      directorySearchRef.current?.focus({ preventScroll: true });
    });
  }
  function readSelectedNote() {
    const active = document.activeElement;
    openerRef.current = active instanceof HTMLElement ? active : null;
    setJourneysOpen(false);
    setNoteOpen(true);
  }
  useEffect(() => {
    const header = document.querySelector('.site-header');
    if (!header) return;
    const resize = () =>
      pageRef.current?.style.setProperty(
        '--island-header-height',
        `${header.getBoundingClientRect().height}px`,
      );
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);
  const selected = data.nodes.find((node) => node.id === selectedId)!;
  const journey = data.journeys.find((item) => item.id === journeyId);
  const current = journey?.steps[step];
  const results = useMemo(
    () => IslandService.search(data.nodes, query, group),
    [data.nodes, query, group],
  );
  const related = data.connections.filter(
    (connection) => connection.from === selectedId || connection.to === selectedId,
  );
  const connections = useMemo(() => {
    if (!showConnections || (!journey && !noteOpen)) return [];
    if (journey)
      return journey.steps.slice(1).map((item, index) => ({
        from: item.reverse ? item.nodeId : journey.steps[index].nodeId,
        to: item.reverse ? journey.steps[index].nodeId : item.nodeId,
        label: item.connection ?? '',
        kind: 'journey',
      }));
    return data.connections.filter(
      (connection) => connection.from === selectedId || connection.to === selectedId,
    );
  }, [data.connections, journey, selectedId, showConnections, noteOpen]);
  const closeNote = useCallback(() => {
    setNoteOpen(false);
    requestAnimationFrame(() => {
      const opener = openerRef.current;
      if (opener?.isConnected && !opener.closest('[inert]') && opener.getClientRects().length > 0)
        opener.focus({ preventScroll: true });
      else
        (homeRef.current?.disabled ? directoryToggleRef.current : homeRef.current)?.focus({
          preventScroll: true,
        });
    });
  }, []);
  const revealMap = useCallback(() => {
    if (window.matchMedia('(max-width:1000px)').matches) setPanelCollapsed(true);
  }, []);
  useEffect(() => {
    if (!journeysOpen) return;
    journeyPanelRef.current?.focus({ preventScroll: true });
    const scroll = journeyScrollRef.current;
    const story = scroll?.querySelector<HTMLElement>('.island-story');
    if (scroll) scroll.scrollTop = journey && story ? story.offsetTop - 12 : 0;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeJourneys();
      }
    };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [journeysOpen, closeJourneys, journey]);
  useEffect(() => {
    if (!noteOpen) return;
    noteRef.current?.focus({ preventScroll: true });
    if (noteScrollRef.current) noteScrollRef.current.scrollTop = 0;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeNote();
      }
    };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [noteOpen, selectedId, closeNote]);
  const chooseNode = useCallback(
    (id: string) => {
      const node = data.nodes.find((item) => item.id === id);
      if (!node) return;
      const active = document.activeElement;
      if (active instanceof HTMLElement && !noteRef.current?.contains(active))
        openerRef.current = active === document.body ? null : active;
      setSelectedId(id);
      setGroup(node.group);
      setJourneyId(null);
      setJourneysOpen(false);
      setNoteOpen(true);
      setCommand((previous) => ({ kind: 'node', targetId: id, sequence: previous.sequence + 1 }));
      revealMap();
    },
    [data.nodes, revealMap],
  );
  const chooseGroup = useCallback(
    (id: IslandGroupId) => {
      setGroup(id);
      setQuery('');
      setJourneyId(null);
      setJourneysOpen(false);
      setNoteOpen(false);
      setCommand((previous) => ({ kind: 'group', targetId: id, sequence: previous.sequence + 1 }));
      revealMap();
    },
    [revealMap],
  );
  const chooseDistrict = useCallback(
    (id: string) => {
      const district = data.districts.find((item) => item.id === id);
      if (!district) return;
      setGroup(district.group);
      setQuery('');
      setJourneyId(null);
      setJourneysOpen(false);
      setNoteOpen(false);
      setCommand((previous) => ({
        kind: 'district',
        targetId: id,
        sequence: previous.sequence + 1,
      }));
      revealMap();
    },
    [data.districts, revealMap],
  );
  function camera(kind: IslandCameraCommand['kind']) {
    if (kind === 'reset') {
      setGroup('all');
      setQuery('');
      setNoteOpen(false);
    }
    setCommand((previous) => ({ kind, sequence: previous.sequence + 1 }));
  }
  function startJourney(id: string) {
    const item = data.journeys.find((value) => value.id === id)!;
    setJourneyId(id);
    setStep(0);
    setGroup('all');
    setQuery('');
    setSelectedId(item.steps[0].nodeId);
    setNoteOpen(false);
    setShowConnections(true);
    setJourneysOpen(false);
    camera('reset');
    requestAnimationFrame(() => journeyDetailsRef.current?.focus({ preventScroll: true }));
  }
  function goStep(index: number) {
    if (!journey) return;
    setStep(index);
    setSelectedId(journey.steps[index].nodeId);
  }
  return (
    <div className="island-page" ref={pageRef}>
      <div className="island-workspace" data-panel-collapsed={panelCollapsed}>
        <div className="island-map-column">
          <section
            className="island-map"
            id="island-map"
            aria-label="公民島互動地圖"
            data-scene={status}
            data-note-open={noteOpen}
            data-journeys-open={journeysOpen}
          >
            <div className="island-map-toolbar">
              <header className="island-map-intro">
                <p className="eyebrow">
                  <Compass size={18} aria-hidden="true" />
                  公民島 / CIVIC ISLAND
                </p>
                <h1>把制度，連成看得懂的風景。</h1>
                <p>點島名看分區，再拉近一區，認識裡面的機關。</p>
                {(group === 'central' || group === 'local') &&
                  (command.kind === 'district' || command.kind === 'node') && (
                    <button
                      type="button"
                      className="island-back-districts"
                      onClick={() => chooseGroup(group)}
                    >
                      <ArrowLeft size={16} aria-hidden="true" />
                      回到島內分區
                    </button>
                  )}
              </header>
              <div className="island-map-controls" role="group" aria-label="地圖視角控制">
                <button
                  type="button"
                  aria-label="放大地圖"
                  title="放大地圖"
                  onClick={() => camera('in')}
                  disabled={status !== 'ready'}
                >
                  <Plus size={19} />
                </button>
                <button
                  type="button"
                  aria-label="縮小地圖"
                  title="縮小地圖"
                  onClick={() => camera('out')}
                  disabled={status !== 'ready'}
                >
                  <Minus size={19} />
                </button>
                <button
                  type="button"
                  aria-label="俯視地圖"
                  title="俯視地圖"
                  onClick={() => camera('top')}
                  disabled={status !== 'ready'}
                >
                  <Scan size={19} />
                </button>
                <button
                  ref={homeRef}
                  type="button"
                  aria-label="重設地圖視角"
                  title="全島總覽"
                  onClick={() => camera('reset')}
                  disabled={status !== 'ready'}
                >
                  <RotateCcw size={18} />
                </button>
              </div>
            </div>
            <Scene
              key={generation}
              groups={data.groups}
              districts={data.districts}
              nodes={data.nodes}
              activity={data.activity}
              selectedId={selectedId}
              highlightSelected={Boolean(journey) || noteOpen}
              activeGroup={group}
              connections={connections}
              command={command}
              onSelect={chooseNode}
              onGroup={chooseGroup}
              onDistrict={chooseDistrict}
              onStatus={setStatus}
            />
            <button
              type="button"
              ref={directoryToggleRef}
              className="island-panel-toggle"
              aria-label={panelCollapsed ? '展開搜尋欄' : '收合搜尋欄'}
              title={panelCollapsed ? '展開搜尋欄' : '收合搜尋欄'}
              aria-expanded={!panelCollapsed}
              aria-controls="island-directory-panel"
              onClick={() => (panelCollapsed ? openDirectory() : closeDirectory())}
            >
              {panelCollapsed ? (
                <ChevronLeft size={19} aria-hidden="true" />
              ) : (
                <ChevronRight size={19} aria-hidden="true" />
              )}
              <span>{panelCollapsed ? '搜尋' : '收合'}</span>
            </button>
            {status === 'unavailable' && (
              <div className="island-scene-unavailable" role="status">
                <Compass size={32} aria-hidden="true" />
                <h2>這個裝置暫時無法顯示立體島嶼</h2>
                <p>仍可使用機關清單搜尋與查看筆記，也可前往政府與司法原頁閱讀介紹。</p>
                <button
                  type="button"
                  onClick={() => {
                    setStatus('loading');
                    setGeneration((value) => value + 1);
                  }}
                >
                  重新載入立體地圖
                </button>
              </div>
            )}
            {noteOpen && (
              <section
                className="island-note island-note-overlay"
                role="dialog"
                aria-modal="false"
                id="island-note"
                ref={noteRef}
                tabIndex={-1}
                aria-labelledby="island-note-title"
              >
                <header className="island-note-header">
                  <div>
                    <p className="island-note-tag">
                      {data.groups.find((item) => item.id === selected.group)?.name} / 機關筆記
                    </p>
                    <h2 id="island-note-title">{selected.name}</h2>
                  </div>
                  <button
                    type="button"
                    className="island-note-close"
                    aria-label="關閉機關筆記"
                    onClick={closeNote}
                  >
                    <X size={23} aria-hidden="true" />
                  </button>
                </header>
                <div className="island-note-scroll" ref={noteScrollRef}>
                  <IslandNote node={selected} />
                  {related.length > 0 && (
                    <div className="island-related">
                      <h3>和誰有什麼關係？</h3>
                      {related.map((item, index) => {
                        const other = data.nodes.find(
                          (node) => node.id === (item.from === selectedId ? item.to : item.from),
                        )!;
                        return (
                          <button
                            type="button"
                            key={item.from + '-' + item.to + '-' + index}
                            onClick={() => chooseNode(other.id)}
                          >
                            <span>
                              {item.fromLabel ??
                                data.nodes.find((node) => node.id === item.from)?.name}{' '}
                              →{' '}
                              {item.toLabel ?? data.nodes.find((node) => node.id === item.to)?.name}
                            </span>
                            <strong>{item.label}</strong>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <button type="button" className="island-note-back" onClick={closeNote}>
                    關閉筆記，繼續探索 <ArrowRight size={17} aria-hidden="true" />
                  </button>
                </div>
              </section>
            )}
            {journey && current && !noteOpen && !journeysOpen && (
              <div className="island-map-trip" aria-label="地圖上的旅程控制">
                <button
                  type="button"
                  className="island-trip-close"
                  aria-label="結束情境導覽"
                  title="結束情境導覽"
                  onClick={() => {
                    setJourneyId(null);
                    requestAnimationFrame(() =>
                      journeyToggleRef.current?.focus({ preventScroll: true }),
                    );
                  }}
                >
                  <X size={17} aria-hidden="true" />
                </button>
                <div className="island-trip-copy">
                  <span>
                    {journey.title} · {step + 1} / {journey.steps.length}
                  </span>
                  <strong>{current.title}</strong>
                </div>
                <div>
                  <button
                    type="button"
                    disabled={step === 0}
                    onClick={() => goStep(step - 1)}
                    aria-label="旅程上一步"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <button
                    type="button"
                    disabled={step === journey.steps.length - 1}
                    onClick={() => goStep(step + 1)}
                    aria-label="旅程下一步"
                  >
                    <ArrowRight size={18} />
                  </button>
                  <button
                    type="button"
                    ref={journeyDetailsRef}
                    className="island-trip-details"
                    aria-label="查看情境完整說明"
                    onClick={openJourneys}
                  >
                    說明
                  </button>
                  <button type="button" className="island-trip-read" onClick={readSelectedNote}>
                    讀機關筆記
                  </button>
                </div>
              </div>
            )}
            <button
              type="button"
              className="island-journey-toggle"
              ref={journeyToggleRef}
              hidden={journeysOpen || noteOpen || Boolean(journey)}
              aria-expanded={journeysOpen}
              aria-controls="island-journeys"
              onClick={openJourneys}
            >
              <Route size={19} aria-hidden="true" />
              情境導覽
              <ChevronUp size={17} aria-hidden="true" />
            </button>
            <section
              className="island-journeys"
              role="dialog"
              aria-modal="false"
              hidden={!journeysOpen}
              inert={!journeysOpen}
              ref={journeyPanelRef}
              tabIndex={-1}
              id="island-journeys"
              aria-labelledby="island-journeys-title"
            >
              <div className="island-section-heading">
                <div>
                  <p className="eyebrow">
                    <Route size={19} aria-hidden="true" />
                    跟著情境，跨島走一趟
                  </p>
                  <h2 id="island-journeys-title">事情發生後，輪到誰做什麼？</h2>
                </div>
                <button
                  type="button"
                  className="island-journeys-close"
                  aria-label="關閉情境導覽"
                  onClick={closeJourneys}
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>
              <div className="island-journeys-scroll" ref={journeyScrollRef}>
                <button
                  className="island-connection-toggle"
                  type="button"
                  aria-pressed={showConnections}
                  onClick={() => setShowConnections((value) => !value)}
                >
                  關係連線：{showConnections ? '開啟' : '關閉'}
                </button>
                <div className="island-journey-choices">
                  {data.journeys.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      aria-pressed={journeyId === item.id}
                      onClick={() => startJourney(item.id)}
                    >
                      {item.title}
                      <ArrowRight size={18} aria-hidden="true" />
                    </button>
                  ))}
                </div>
                {journey && current ? (
                  <div className="island-story">
                    <p className="eyebrow">
                      {journey.title} · {step + 1} / {journey.steps.length}
                    </p>
                    <ol className="island-story-steps">
                      {journey.steps.map((item, index) => (
                        <li key={item.nodeId}>
                          <button
                            type="button"
                            aria-current={step === index ? 'step' : undefined}
                            aria-label={`第 ${index + 1} 步：${item.title}`}
                            onClick={() => goStep(index)}
                          >
                            {index + 1}
                          </button>
                        </li>
                      ))}
                    </ol>
                    <div className="island-story-copy" id="island-journey-step" aria-live="polite">
                      <h3>{current.title}</h3>
                      <p>{current.text}</p>
                    </div>
                    <div className="island-story-actions">
                      <button type="button" onClick={() => goStep(step - 1)} disabled={step === 0}>
                        <ArrowLeft size={17} aria-hidden="true" />
                        上一步
                      </button>
                      <button
                        type="button"
                        onClick={() => goStep(step + 1)}
                        disabled={step === journey.steps.length - 1}
                      >
                        下一步
                        <ArrowRight size={17} aria-hidden="true" />
                      </button>
                      <button type="button" onClick={() => goStep(0)}>
                        重來
                      </button>
                      <button type="button" onClick={() => setJourneyId(null)}>
                        結束導覽
                      </button>
                    </div>
                    <p className="island-story-notice">{journey.notice}</p>
                  </div>
                ) : (
                  <p className="island-journey-hint">
                    選一段旅程，地圖上的建築與連線會跟著亮起，也可逐步或跳步閱讀。
                  </p>
                )}
                <p className="island-map-notice">
                  島嶼與分區是學習主題的示意，不代表真實地點、機關隸屬或行政層級。法院依法獨立審判；連線也不一定是上下隸屬。
                </p>
              </div>
            </section>
            <div className="island-map-footer">
              <span>
                <Compass size={18} aria-hidden="true" />
                <span className="island-touch-hint">點島名 · 選分區 · 拉近看機關</span>
                <span className="island-mouse-hint">左鍵移動 · 右鍵旋轉 · 滾輪縮放</span>
              </span>
              <button type="button" className="island-open-directory" onClick={openDirectory}>
                <Search size={17} aria-hidden="true" />
                搜尋機關
              </button>
              <span className="island-map-state" role="status">
                {group === 'all' ? '全島總覽' : data.groups.find((item) => item.id === group)?.name}
              </span>
            </div>
          </section>
        </div>
        <aside
          className="island-panel"
          ref={directoryPanelRef}
          id="island-directory-panel"
          tabIndex={-1}
          aria-label="機關探索與搜尋"
          inert={panelCollapsed}
          aria-hidden={panelCollapsed}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              closeDirectory();
            }
          }}
        >
          <div className="island-panel-heading">
            <button
              type="button"
              className="island-directory-close"
              aria-label="收合搜尋欄"
              onClick={closeDirectory}
            >
              <X size={20} aria-hidden="true" />
            </button>
            <p className="eyebrow">THE CIVIC DIRECTORY</p>
            <h2>從一個名字，認識它的工作。</h2>
            <p>{data.nodes.length} 項角色與機關，點選即可閱讀。</p>
          </div>
          <label className="island-search">
            <Search size={19} aria-hidden="true" />
            <span className="sr-only">搜尋公民島機關與角色</span>
            <input
              ref={directorySearchRef}
              type="search"
              placeholder="例如：交通、檢察官、議員"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <nav className="island-group-tabs" aria-label="島嶼分類">
            <button type="button" aria-pressed={group === 'all'} onClick={() => camera('reset')}>
              <Layers size={18} aria-hidden="true" />
              全島
            </button>
            {data.groups.map((item, index) => (
              <button
                type="button"
                key={item.id}
                aria-pressed={group === item.id}
                onClick={() => chooseGroup(item.id)}
              >
                <span className="island-color-dot" style={{ background: item.color }} />
                {String(index + 1).padStart(2, '0')} {item.name}
              </button>
            ))}
          </nav>
          {data.districts.some((item) => item.group === group) && (
            <nav className="island-district-tabs" aria-label="島內職能分區">
              <p>選一區拉近看</p>
              {data.districts
                .filter((item) => item.group === group)
                .map((district) => (
                  <button
                    type="button"
                    key={district.id}
                    onClick={() => chooseDistrict(district.id)}
                    aria-pressed={command.kind === 'district' && command.targetId === district.id}
                  >
                    {district.name}
                    <span>{district.members.length}</span>
                  </button>
                ))}
            </nav>
          )}
          <p className="island-result-count" role="status">
            {group === 'all' ? '全島' : data.groups.find((item) => item.id === group)?.name} · 找到{' '}
            {results.length} 項
          </p>
          <div className="island-directory" aria-label="符合的機關與角色">
            {results.length === 0 ? (
              <p className="island-no-results">
                找不到符合的項目。
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setGroup('all');
                  }}
                >
                  清除搜尋與分類
                </button>
              </p>
            ) : (
              results.map((node) => (
                <button
                  type="button"
                  key={node.id}
                  className={noteOpen && selectedId === node.id ? 'is-selected' : ''}
                  aria-pressed={noteOpen && selectedId === node.id}
                  onClick={() => chooseNode(node.id)}
                >
                  <span>{node.name}</span>
                  <small>
                    {data.groups.find((item) => item.id === node.group)?.name} · {node.kind}
                  </small>
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              ))
            )}
          </div>
        </aside>
      </div>
      <noscript>
        <style>
          {
            'html:has(.island-page), body:has(.island-page) { overflow: auto; } .island-page { height: auto; overflow: visible; } .island-workspace { display: none; }'
          }
        </style>
        <div className="container island-nojs">
          <h1>公民島互動探索</h1>
          <p className="notice">
            啟用 JavaScript 後可以探索立體島嶼；你也可以直接閱讀：
            <Link href="/government/">政府怎麼運作的完整介紹</Link>、
            <Link href="/justice/">司法與警檢完整介紹</Link>。
          </p>
        </div>
      </noscript>
    </div>
  );
}
