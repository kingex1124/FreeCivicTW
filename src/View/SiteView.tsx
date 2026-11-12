import Link from 'next/link';
import { ArrowUpRight, ArrowRight, Sprout } from 'lucide-react';
import { SiteService } from '@/Service/SiteService';
import type { ActionProps, IntroProps, MarkProps, SectionHeadingProps } from '@/Model/UiModel';

export function Brand({ small = false }: MarkProps) {
  return (
    <Link href="/" className={`brand ${small ? 'brand-small' : ''}`} aria-label="FreeCivicTW 首頁">
      <span className="brand-mark" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </span>
      <span>
        <strong>
          公民自由課<span className="brand-dot">.</span>
        </strong>
        <small>FREE CIVIC TAIWAN</small>
      </span>
    </Link>
  );
}
export function ActionLink({ href, children, secondary, className = '' }: ActionProps) {
  return (
    <Link
      href={href}
      className={`${secondary ? 'button-secondary' : 'button-primary'} ${className}`}
    >
      {children}
      <ArrowUpRight size={18} aria-hidden="true" />
    </Link>
  );
}
export function PageIntro({ eyebrow, title, description, children }: IntroProps) {
  return (
    <section className="page-intro container">
      <div className="eyebrow">
        <span />
        {eyebrow}
      </div>
      <h1>{title}</h1>
      <p className="intro-copy">{description}</p>
      {children}
      <div className="page-intro-line" />
    </section>
  );
}
export function SectionHeading({
  number,
  eyebrow,
  title,
  description,
  href,
  linkLabel = '探索更多',
}: SectionHeadingProps) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && (
          <div className="eyebrow">
            {number && <span>{number}</span>}
            {eyebrow}
          </div>
        )}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {href && (
        <Link className="text-link" href={href}>
          {linkLabel}
          <ArrowRight size={17} />
        </Link>
      )}
    </div>
  );
}
export function Footer() {
  const site = SiteService.get();
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div>
          <Brand small />
          <p>
            民主不是遠方的大事，
            <br />
            是你我都能理解、參與的日常。
          </p>
        </div>
        <div className="footer-links">
          <div>
            <strong>從這裡開始</strong>
            <Link href="/learn/">公民快速入門</Link>
            <Link href="/government/">政府怎麼運作</Link>
            <Link href="/justice/">司法與警檢</Link>
            <Link href="/my-ballots/">我能選哪些職務</Link>
          </div>
          <div>
            <strong>保持好奇，也保持查證</strong>
            <Link href="/media-literacy/">媒體識讀練習</Link>
            <Link href="/oversight/">民間監督與公民資源</Link>
            <Link href="/resources/">便民查詢</Link>
            <Link href="/more/">看更多：選舉、政治與憲法</Link>
            <Link href="/sources/">來源與更正</Link>
            <Link href="/about/">關於與聯絡</Link>
          </div>
        </div>
        <div className="footer-note">
          <Sprout size={25} />
          <p>為每一個願意多了解一點的人而做。</p>
          <a href={site.contact.mailto}>
            {site.contact.email}
            <ArrowUpRight size={14} />
          </a>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} FreeCivicTW · 公民教育計畫</span>
        <Link href="/privacy/">隱私與分析設定</Link>
        <span>制度資料查核：{site.updatedAt}</span>
      </div>
    </footer>
  );
}
