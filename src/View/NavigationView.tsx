'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, Menu, X, Leaf } from 'lucide-react';
import { Brand } from './SiteView';
import { SiteService } from '@/Service/SiteService';
export function NavigationView() {
  const pathname = SiteService.routePath(usePathname());
  const [open, setOpen] = useState(false);
  const [reduced, setReduced] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const preferred =
      SiteService.readMotion() || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.documentElement.dataset.motion = preferred ? 'reduced' : 'full';
    setReduced(preferred);
  }, []);
  const links = [
    ['/learn/', '公民入門'],
    ['/government/', '政府怎麼運作'],
    ['/justice/', '司法與警檢'],
    ['/media-literacy/', '媒體識讀'],
    ['/about/', '關於本站'],
  ];
  return (
    <header
      className="site-header"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          setOpen(false);
          menuButton.current?.focus();
        }
      }}
    >
      <div className="container header-inner">
        <Brand />
        <nav className={`main-nav ${open ? 'is-open' : ''}`} aria-label="主要導覽">
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              aria-current={pathname.startsWith(href.slice(0, -1)) ? 'page' : undefined}
            >
              {label}
            </Link>
          ))}
          <Link href="/my-ballots/" className="nav-cta" onClick={() => setOpen(false)}>
            我的選票指南
            <ArrowUpRight size={15} />
          </Link>
        </nav>
        <div className="header-actions">
          <button
            className="icon-button motion-toggle"
            aria-label={reduced ? '開啟動畫' : '減少動畫'}
            aria-pressed={reduced}
            onClick={() => {
              const next = !reduced;
              setReduced(next);
              SiteService.saveMotion(next);
              document.documentElement.dataset.motion = next ? 'reduced' : 'full';
            }}
            title="切換減少動畫"
          >
            <Leaf size={18} />
          </button>
          <button
            ref={menuButton}
            className="icon-button mobile-toggle"
            aria-label={open ? '關閉導覽' : '開啟導覽'}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  );
}
