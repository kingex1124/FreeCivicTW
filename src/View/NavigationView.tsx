'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { Brand } from './SiteView';
import { ThemeToggle } from './ThemeView';
import { SiteService } from '@/Service/SiteService';
export function NavigationView() {
  const pathname = SiteService.routePath(usePathname());
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const links = [
    ['/learn/', '公民入門'],
    ['/government/', '政府怎麼運作'],
    ['/justice/', '司法與警檢'],
    ['/oversight/', '民間監督'],
    ['/resources/', '便民查詢'],
    ['/media-literacy/', '媒體識讀'],
    ['/more/', '看更多'],
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
                onClick={() => setOpen(false)}
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
            onClick={() => setOpen(false)}
          >
            我的選票指南
            <ArrowUpRight size={15} />
          </Link>
        </nav>
        <div className="header-actions">
          <ThemeToggle />
          <button
            ref={menuButton}
            className="icon-button mobile-toggle"
            aria-label={open ? '關閉導覽' : '開啟導覽'}
            aria-expanded={open}
            aria-controls="main-navigation"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
            <span>導覽</span>
          </button>
        </div>
      </div>
    </header>
  );
}
