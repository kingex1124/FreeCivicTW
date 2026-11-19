'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, Menu, X, ChevronDown, ChevronUp, CupSoda } from 'lucide-react';
import { Brand } from './SiteView';
import { ThemeToggle } from './ThemeView';
import { SiteService } from '@/Service/SiteService';
export function NavigationView() {
  const support = SiteService.get().support;
  const pathname = SiteService.routePath(usePathname());
  const [openPath, setOpenPath] = useState<string | null>(null);
  const [headerPath, setHeaderPath] = useState<string | null>(null);
  const [previousPath, setPreviousPath] = useState(pathname);
  if (previousPath !== pathname) {
    setPreviousPath(pathname);
    setOpenPath(null);
    setHeaderPath(null);
  }
  const open = openPath === pathname;
  const island = pathname.startsWith('/civic-island');
  const headerCollapsed = island && headerPath !== pathname;
  const menuButton = useRef<HTMLButtonElement>(null);
  const headerButton = useRef<HTMLButtonElement>(null);
  const links = [
    ['/learn/', '公民入門'],
    ['/government/', '政府怎麼運作'],
    ['/justice/', '司法與警檢'],
    ['/oversight/', '民間監督'],
    ['/resources/', '便民查詢'],
    ['/media-literacy/', '媒體識讀'],
    ['/civic-island/', '公民島'],
    ['/more/', '看更多'],
    ['/about/', '關於本站'],
  ];
  return (
    <header
      className={`site-header${island ? ' island-header' : ''}`}
      data-header-collapsed={headerCollapsed}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          setOpenPath(null);
          menuButton.current?.focus();
        } else if (e.key === 'Escape' && island && !headerCollapsed) {
          setHeaderPath(null);
          headerButton.current?.focus();
        }
      }}
    >
      <div
        className="site-header-bar"
        id="site-header-bar"
        inert={headerCollapsed}
        aria-hidden={headerCollapsed}
      >
        <div className="site-header-content">
          <div className="container header-inner">
            <Brand />
            <nav
              id="main-navigation"
              className={`main-nav ${open ? 'is-open' : ''}`}
              aria-label="主要導覽"
            >
              <div className="nav-links">
                {links.map(([href, label]) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpenPath(null)}
                    aria-current={pathname.startsWith(href.slice(0, -1)) ? 'page' : undefined}
                  >
                    {label}
                  </Link>
                ))}
              </div>
              <Link
                href="/my-ballots/"
                className="nav-cta"
                aria-current={pathname.startsWith('/my-ballots') ? 'page' : undefined}
                onClick={() => setOpenPath(null)}
              >
                我的選票指南
                <ArrowUpRight size={15} />
              </Link>
              <a
                href={support.url}
                className="nav-support"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpenPath(null)}
              >
                <CupSoda size={16} aria-hidden="true" />
                <span>{support.navLabel}</span>
                <span className="sr-only">（另開分頁）</span>
              </a>
            </nav>
            <div className="header-actions">
              <ThemeToggle />
              <button
                ref={menuButton}
                className="icon-button mobile-toggle"
                aria-label={open ? '關閉導覽' : '開啟導覽'}
                aria-expanded={open}
                aria-controls="main-navigation"
                onClick={() => setOpenPath(open ? null : pathname)}
              >
                {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
                <span>導覽</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      {island && (
        <button
          type="button"
          ref={headerButton}
          className="island-header-toggle"
          aria-label={headerCollapsed ? '展開網站頂列' : '收合網站頂列'}
          aria-expanded={!headerCollapsed}
          aria-controls="site-header-bar"
          onClick={() => {
            setHeaderPath(headerCollapsed ? pathname : null);
            setOpenPath(null);
          }}
        >
          {headerCollapsed ? (
            <ChevronDown size={18} aria-hidden="true" />
          ) : (
            <ChevronUp size={18} aria-hidden="true" />
          )}
          <span>{headerCollapsed ? '展開頂列' : '收合頂列'}</span>
        </button>
      )}
    </header>
  );
}
