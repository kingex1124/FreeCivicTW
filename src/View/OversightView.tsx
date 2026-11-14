'use client';
import { useEffect, useState } from 'react';
import { ArrowRight, ChevronDown, ExternalLink, Search, Users } from 'lucide-react';
import { OversightService } from '@/Service/OversightService';
import { SourceList } from './SourceView';
import type { OversightFilter, OversightViewProps } from '@/Model/OversightModel';

export function OversightView({ data }: OversightViewProps) {
  const [group, setGroup] = useState<OversightFilter['group']>('all');
  const [scope, setScope] = useState<OversightFilter['scope']>('all');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string[]>([]);
  const organizations = OversightService.filter(data, { group, scope, query });

  useEffect(() => {
    const revealLinkedOrganization = () => {
      const id = window.location.hash.replace(/^#org-/, '');
      if (!data.organizations.some((organization) => organization.id === id)) return;
      setGroup('all');
      setScope('all');
      setQuery('');
      setExpanded((previous) => (previous.includes(id) ? previous : [...previous, id]));
      requestAnimationFrame(() => {
        document
          .getElementById(`org-${id}`)
          ?.scrollIntoView({ block: 'start', behavior: 'instant' });
      });
    };
    revealLinkedOrganization();
    window.addEventListener('hashchange', revealLinkedOrganization);
    return () => window.removeEventListener('hashchange', revealLinkedOrganization);
  }, [data.organizations]);

  function clearFilters() {
    setGroup('all');
    setScope('all');
    setQuery('');
  }

  return (
    <div className="container section-bottom oversight-page">
      <nav className="government-jumps" aria-label="民間監督教學段落">
        <a href="#oversight-directory">找監督組織與公開資源</a>
        <a href="#oversight-reading">怎麼閱讀監督成果？</a>
        <a href="#oversight-selection">這份名單怎麼選？</a>
      </nav>
      <p className="oversight-intro">{data.intro}</p>
      <section id="oversight-directory" aria-labelledby="oversight-directory-title">
        <div className="section-heading">
          <div>
            <div className="eyebrow">從你關心的議題開始</div>
            <h2 id="oversight-directory-title">民間監督組織與公民資源</h2>
            <p>點開團體，看看它關注什麼、有哪些公開成果，以及你可以如何使用。</p>
          </div>
        </div>
        <noscript>
          <style>{'.oversight-controls { display: none; }'}</style>
          <p className="notice">
            目前未啟用 JavaScript，仍可逐項展開並閱讀全部團體；搜尋與篩選需啟用互動。
          </p>
        </noscript>
        <div className="oversight-controls">
          <div className="agency-filters oversight-filters" role="group" aria-label="監督主題篩選">
            <button type="button" aria-pressed={group === 'all'} onClick={() => setGroup('all')}>
              全部主題
            </button>
            {data.groups.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={group === item.id}
                onClick={() => setGroup(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="oversight-search-row">
            <label className="agency-search" htmlFor="oversight-query">
              <span>搜尋團體、議題或公開資源</span>
              <span>
                <Search size={18} aria-hidden="true" />
                <input
                  id="oversight-query"
                  type="search"
                  value={query}
                  placeholder="例如：議會、司法、環境、開放資料"
                  onChange={(event) => setQuery(event.target.value)}
                />
              </span>
            </label>
            <label htmlFor="oversight-scope">
              主要關注範圍
              <select
                id="oversight-scope"
                value={scope}
                onChange={(event) => setScope(event.target.value as OversightFilter['scope'])}
              >
                <option value="all">全國與地方</option>
                <option value="national">全國性議題</option>
                <option value="local">地方議會與政策</option>
              </select>
            </label>
          </div>
          {group !== 'all' && (
            <p className="oversight-group-note">
              {data.groups.find((item) => item.id === group)?.description}
            </p>
          )}
          <div className="agency-toolbar">
            <p role="status" aria-live="polite">
              顯示 {organizations.length}／{data.organizations.length} 個團體與資源
            </p>
            <div>
              <button
                type="button"
                className="button-secondary"
                onClick={() =>
                  setExpanded((previous) => [
                    ...new Set([...previous, ...organizations.map((item) => item.id)]),
                  ])
                }
              >
                展開目前結果
              </button>
              <button
                type="button"
                className="button-secondary"
                onClick={() =>
                  setExpanded((previous) =>
                    previous.filter((id) => !organizations.some((item) => item.id === id)),
                  )
                }
              >
                收合目前結果
              </button>
              <button type="button" className="quiet-button" onClick={clearFilters}>
                清除篩選
              </button>
            </div>
          </div>
        </div>
        {organizations.length === 0 && (
          <div className="oversight-empty">
            <h3>找不到符合的團體</h3>
            <p>可以換個關鍵字、放寬主題或地區，或清除篩選查看全部。</p>
            <button className="text-link" type="button" onClick={clearFilters}>
              清除篩選 <ArrowRight size={16} />
            </button>
          </div>
        )}
        <div className="oversight-organizations">
          {organizations.map((organization) => (
            <details
              className="oversight-organization"
              key={organization.id}
              id={`org-${organization.id}`}
              open={expanded.includes(organization.id)}
              onToggle={(event) => {
                const open = event.currentTarget.open;
                setExpanded((previous) =>
                  open
                    ? previous.includes(organization.id)
                      ? previous
                      : [...previous, organization.id]
                    : previous.includes(organization.id)
                      ? previous.filter((id) => id !== organization.id)
                      : previous,
                );
              }}
            >
              <summary>
                <span>
                  <span className="oversight-organization-tags">
                    <span>{data.groups.find((item) => item.id === organization.group)?.label}</span>
                    <span>{organization.coverage}</span>
                  </span>
                  <h3>{organization.shortName}</h3>
                  <span className="oversight-organization-summary">{organization.summary}</span>
                  <span className="oversight-organization-kind">
                    {organization.name} · {organization.kind}
                  </span>
                </span>
                <ChevronDown size={23} aria-hidden="true" />
              </summary>
              <div className="oversight-organization-body">
                <div className="oversight-watch-targets">
                  <Users size={20} aria-hidden="true" />
                  <p>
                    <strong>主要關注對象：</strong>
                    {organization.watchTargets.join('、')}
                  </p>
                </div>
                <div className="oversight-organization-columns">
                  <section>
                    <h4>主要在做什麼？</h4>
                    <dl className="citizen-oversight-work">
                      {organization.work.map((item) => (
                        <div key={item.title}>
                          <dt>{item.title}</dt>
                          <dd>{item.text}</dd>
                        </div>
                      ))}
                    </dl>
                    <h4>你可以怎麼使用這些資料？</h4>
                    <ol>
                      {organization.howToUse.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ol>
                  </section>
                  <section>
                    <h4>公開成果與資料入口</h4>
                    <ul className="oversight-resources">
                      {organization.resources.map((resource) => (
                        <li key={resource.url}>
                          <a href={resource.url} target="_blank" rel="noopener noreferrer">
                            {resource.label}
                            <ExternalLink size={15} aria-hidden="true" />
                          </a>
                          <p>{resource.description}</p>
                        </li>
                      ))}
                    </ul>
                    <h4>想進一步參與</h4>
                    <ul>
                      {organization.participation.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <div className="oversight-boundary-note">
                      <h4>權限界線與閱讀提醒</h4>
                      <ul>
                        {organization.limits.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </section>
                </div>
                <a
                  className="text-link"
                  href={organization.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  前往{organization.shortName}官網 <ExternalLink size={16} aria-hidden="true" />
                </a>
                <SourceList
                  sourceIds={organization.sourceIds}
                  compact
                  headingLevel="h4"
                  className="oversight-sources"
                  summary="查看組織介紹與資料依據"
                />
              </div>
            </details>
          ))}
        </div>
      </section>
      <section
        className="section-space"
        id="oversight-reading"
        aria-labelledby="oversight-reading-title"
      >
        <div className="section-heading">
          <div>
            <div className="eyebrow">理解資料，也檢視方法</div>
            <h2 id="oversight-reading-title">{data.readingGuide.title}</h2>
          </div>
        </div>
        <div className="citizen-oversight-layout">
          <div className="citizen-oversight-card citizen-oversight-guide">
            <h3>從原始資料形成自己的判斷</h3>
            <ol>
              {data.readingGuide.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
          <div className="citizen-oversight-card">
            <h3>民間監督與公權力有什麼不同？</h3>
            <ul className="oversight-boundaries">
              {data.readingGuide.boundaries.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <section
        className="oversight-selection"
        id="oversight-selection"
        aria-labelledby="oversight-selection-title"
      >
        <h2 id="oversight-selection-title">{data.selection.title}</h2>
        <ul>
          {data.selection.criteria.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>{data.selection.note}</p>
        <p className="board-note">
          資料查核：{data.checkedAt}。團體的活動、服務資格與公開資料，以其最新公告為準。
        </p>
      </section>
    </div>
  );
}
