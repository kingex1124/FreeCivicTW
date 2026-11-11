'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, ExternalLink, X } from 'lucide-react';
import {
  getAgencyCounts,
  getLocalAgencyInventories,
  searchAgencyEntries,
  filterAgencyOptions,
} from '@/Service/AgencyService';
import type {
  AgencyDirectoryProps,
  AgencyFilter,
  AgencyPickerProps,
  AgencyDetailsProps,
} from '@/Model/AgencyModel';
import { SourceList } from './SourceView';

export function AgencyPicker({
  open,
  onClose,
  scope,
  options,
  selectedId,
  collectionId,
  collections,
  onCollectionChange,
  onSelect,
}: AgencyPickerProps) {
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const visible = filterAgencyOptions(options, query);
  const selected = options.find((option) => option.id === selectedId);
  useEffect(() => {
    if (open) searchRef.current?.focus({ preventScroll: true });
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', closeWithEscape);
    return () => document.removeEventListener('keydown', closeWithEscape);
  }, [open, onClose]);
  return (
    <dialog
      className="agency-picker-dialog"
      id="agency-picker-dialog"
      open={open}
      aria-labelledby="agency-picker-title"
      aria-describedby="agency-picker-description"
      aria-modal="false"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="agency-picker-header">
        <div>
          <span className="eyebrow">選擇想了解的機關 · {options.length} 個單位</span>
          <h3 id="agency-picker-title">
            {scope === 'central' ? '各部會與中央機關' : '各局處與地方單位'}
          </h3>
        </div>
        <button
          type="button"
          className="agency-picker-close"
          onClick={onClose}
          aria-label="關閉機關選擇"
        >
          <X size={22} aria-hidden="true" />
        </button>
      </div>
      <div className="agency-picker-body">
        <p id="agency-picker-description">
          點選單位後，說明面板會同步更新。可按右上角叉叉或 Esc 關閉。
        </p>
        {selected && (
          <p className="agency-picker-current" role="status">
            目前選擇：{selected.name}
          </p>
        )}
        {scope === 'local' && (
          <>
            <label htmlFor="agency-local-collection">地方機關名單</label>
            <select
              id="agency-local-collection"
              value={collectionId}
              onChange={(event) => {
                setQuery('');
                onCollectionChange(event.target.value);
              }}
            >
              <option value="common">常見局處與職能（名稱範例）</option>
              {collections.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}完整一級機關／單位
                </option>
              ))}
            </select>
            <p className="board-note">
              各縣市的名稱與編制不同；常見名單以職能彙整，可切換已核對的地方完整名單。
            </p>
          </>
        )}
        <label htmlFor="agency-picker-query">搜尋可點選的單位</label>
        <input
          id="agency-picker-query"
          ref={searchRef}
          type="search"
          placeholder={scope === 'central' ? '例如：交通部、教育部' : '例如：交通局、社會局'}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoComplete="off"
        />
        <div className="agency-picker-options">
          {visible.map((option) => (
            <button
              type="button"
              key={option.id}
              aria-pressed={option.id === selectedId}
              onClick={() => onSelect(option.id)}
            >
              <strong>{option.name}</strong>
              <span>{option.summary}</span>
            </button>
          ))}
        </div>
        {visible.length === 0 && <p role="status">找不到符合的單位，可清除搜尋文字再查看。</p>}
        <noscript>
          <a className="text-link" href="#agency-directory">
            前往下方機關總覽，逐項展開完整文字
          </a>
        </noscript>
      </div>
    </dialog>
  );
}

export function AgencyDetails({ inspection }: AgencyDetailsProps) {
  return (
    <div className="role-details agency-inspection">
      <p className="role-summary">{inspection.summary}</p>
      <dl>
        <div>
          <dt>這個單位的定位</dt>
          <dd>{inspection.context}</dd>
        </div>
        <div>
          <dt>有哪些權力與工作</dt>
          <dd>
            <ul>
              {inspection.duties.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </dd>
        </div>
        <div>
          <dt>跟我們的生活有什麼關係？</dt>
          <dd>
            <ul>
              {inspection.lifeConnections.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </dd>
        </div>
        <div>
          <dt>權限與分工界線</dt>
          <dd>
            <ul>
              {inspection.limits.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </dd>
        </div>
        {inspection.coverages.length > 0 && (
          <div>
            <dt>適用範圍與地方名稱</dt>
            <dd>
              <ul>
                {inspection.coverages.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </dd>
          </div>
        )}
        <div>
          <dt>生活裡的虛構例子</dt>
          <dd>
            {inspection.examples.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </dd>
        </div>
        <div>
          <dt>官方機關與職掌入口</dt>
          <dd>
            <ul>
              {inspection.officialLinks.map((item) => (
                <li key={item.url}>
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    {item.label}
                    <ExternalLink size={14} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>
      <p className="board-note">資料查核：{inspection.checkedAt}</p>
      <SourceList sourceIds={inspection.sourceIds} compact headingLevel="h3" />
    </div>
  );
}

export function AgencyDirectoryView({ data }: AgencyDirectoryProps) {
  const [group, setGroup] = useState<AgencyFilter['group']>('all');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string[]>([]);
  const entries = useMemo(() => searchAgencyEntries(data, { group, query }), [data, group, query]);
  const counts = getAgencyCounts(data);
  const inventories = getLocalAgencyInventories(data);
  return (
    <section
      className="section-space"
      id="agency-directory"
      aria-labelledby="agency-directory-title"
    >
      <div className="section-heading">
        <div>
          <div className="eyebrow">把機關名稱變成看得懂的工作</div>
          <h2 id="agency-directory-title">{data.title}</h2>
          <p>{data.intro}</p>
        </div>
      </div>
      <details className="agency-directory">
        <summary className="agency-directory-trigger">
          <span>
            <strong>展開／收合政府機關職責總覽</strong>
            <small>
              中央 {counts.central} 個機關 · 地方 {counts.local} 類職能 · 監督與權益保障{' '}
              {counts.oversight} 項
            </small>
          </span>
          <ChevronDown size={24} aria-hidden="true" />
        </summary>
        <div className="agency-directory-body">
          <div className="agency-coverage">
            <h3>這份總覽包含哪些範圍？</h3>
            <ul>
              {data.coverageNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
            <p>資料查核：{data.checkedAt}。各機關最新組織與個案權責，請回到官方資料核對。</p>
          </div>
          <div className="agency-controls">
            <div className="agency-filters" aria-label="機關類別篩選">
              <button type="button" aria-pressed={group === 'all'} onClick={() => setGroup('all')}>
                全部 {data.entries.length}
              </button>
              {data.groups.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  aria-pressed={group === item.id}
                  onClick={() => setGroup(item.id)}
                >
                  {item.label} {counts[item.id]}
                </button>
              ))}
            </div>
            <label className="agency-search" htmlFor="agency-query">
              <span>搜尋機關或服務事項</span>
              <span>
                <Search size={19} aria-hidden="true" />
                <input
                  id="agency-query"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="例如：交通、公車、政風、消費爭議"
                  autoComplete="off"
                />
              </span>
            </label>
            <div className="agency-toolbar">
              <p role="status" aria-live="polite">
                找到 {entries.length} 項，共收錄 {data.entries.length} 項。
              </p>
              <div>
                <button
                  type="button"
                  className="button-secondary"
                  disabled={entries.length === 0}
                  onClick={() =>
                    setExpanded((previous) => [
                      ...new Set([...previous, ...entries.map((entry) => entry.id)]),
                    ])
                  }
                >
                  全部展開
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  disabled={entries.length === 0}
                  onClick={() =>
                    setExpanded((previous) =>
                      previous.filter((id) => !entries.some((entry) => entry.id === id)),
                    )
                  }
                >
                  全部收合
                </button>
                <button
                  type="button"
                  className="quiet-button"
                  onClick={() => {
                    setGroup('all');
                    setQuery('');
                  }}
                >
                  清除篩選
                </button>
              </div>
            </div>
          </div>
          {group !== 'all' && (
            <p className="agency-group-note">
              {data.groups.find((item) => item.id === group)?.description}
            </p>
          )}
          {entries.length === 0 && (
            <p className="agency-empty">
              目前找不到符合的項目，可改用其他關鍵字，或按「清除篩選」查看全部。
            </p>
          )}
          <div className="agency-entries">
            {entries.map((entry) => (
              <details
                className="agency-entry"
                id={`agency-${entry.id}`}
                key={entry.id}
                open={expanded.includes(entry.id)}
                onToggle={(event) => {
                  const open = event.currentTarget.open;
                  setExpanded((previous) =>
                    open
                      ? previous.includes(entry.id)
                        ? previous
                        : [...previous, entry.id]
                      : previous.includes(entry.id)
                        ? previous.filter((id) => id !== entry.id)
                        : previous,
                  );
                }}
              >
                <summary>
                  <span>
                    <span className="agency-entry-tag">
                      {data.groups.find((item) => item.id === entry.group)?.label} ·{' '}
                      {entry.category}
                    </span>
                    <h3>{entry.name}</h3>
                    {entry.group === 'local' && entry.aliases.length > 0 && (
                      <span className="agency-entry-aliases">
                        名稱例：{entry.aliases.slice(0, 4).join('、')}
                      </span>
                    )}
                    <span className="agency-entry-summary">{entry.summary}</span>
                  </span>
                  <ChevronDown size={21} aria-hidden="true" />
                </summary>
                <div className="agency-entry-body">
                  <p className="agency-entry-coverage">{entry.coverage}</p>
                  {entry.aliases.length > 0 && (
                    <p className="muted">名稱與查找提示：{entry.aliases.join('、')}</p>
                  )}
                  <h4>主要在做什麼</h4>
                  <ul>
                    {entry.duties.map((duty) => (
                      <li key={duty}>{duty}</li>
                    ))}
                  </ul>
                  <h4>跟我們的生活有什麼關係？</h4>
                  <ul>
                    {entry.lifeConnections.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <h4>權限與分工界線</h4>
                  <ul>
                    {entry.limits.map((limit) => (
                      <li key={limit}>{limit}</li>
                    ))}
                  </ul>
                  <h4>生活裡的虛構例子</h4>
                  <p>{entry.example}</p>
                  <a
                    className="agency-official-link"
                    href={entry.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    前往官方機關／職掌說明
                    <ExternalLink size={15} aria-hidden="true" />
                  </a>
                  <SourceList sourceIds={entry.sourceIds} compact headingLevel="h4" />
                </div>
              </details>
            ))}
          </div>
          <details className="local-reference-inventories">
            <summary>臺北市、苗栗縣：查看完整一級機關／單位名稱對照</summary>
            <p>
              以下為已核對的兩個地方組織快照，對照上方職能說明；其他縣市請使用後方官方入口查閱。
            </p>
            {inventories.map((inventory) => (
              <section key={inventory.title}>
                <h3>
                  {inventory.title}（{inventory.units.length} 項）
                </h3>
                <dl>
                  {inventory.units.map((unit) => (
                    <div key={unit.name}>
                      <dt>
                        {unit.name}
                        {unit.kind && <small>{unit.kind}</small>}
                      </dt>
                      <dd>對應職能：{unit.topics.join('、')}</dd>
                    </div>
                  ))}
                </dl>
                <SourceList sourceIds={inventory.sourceIds} compact headingLevel="h4" />
              </section>
            ))}
          </details>
          <details className="local-agency-directories">
            <summary>查看 {data.localDirectories.length} 縣市的官方完整機關入口</summary>
            <p>
              各縣市的局處名稱、設置與業務分工不同，可從所在地官網查閱當地完整組織與最新承辦窗口。
            </p>
            <ul>
              {data.localDirectories.map((item) => (
                <li key={item.name}>
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    {item.name}
                    <ExternalLink size={14} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </details>
          <noscript>
            <p>所有項目均可逐項展開閱讀；也可從下方縣市官網查看各地機關。</p>
          </noscript>
        </div>
      </details>
    </section>
  );
}
