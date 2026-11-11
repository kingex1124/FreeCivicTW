import Link from 'next/link';
import { ArrowUpRight, ArrowRight, BookOpen, ScanSearch, Vote, Check, Sprout } from 'lucide-react';
import { LearningService } from '@/Service/LearningService';
import { SiteService } from '@/Service/SiteService';
import { RegionService } from '@/Service/RegionService';
import { CivicService } from '@/Service/CivicService';
import { ActionLink, SectionHeading } from './SiteView';
import { CivicPreviewView } from './CivicPreviewView';
import { LearningPathLink } from './TrackingView';
export function HomeView() {
  const articles = LearningService.getArticles();
  const site = SiteService.get();
  const regions = RegionService.get();
  return (
    <>
      <section className="home-hero container">
        <div className="hero-copy">
          <div className="eyebrow">
            <span />
            給每一個想多了解一點的你
          </div>
          <h1>
            民主，
            <br />
            其實離你<span className="hero-emphasis">很近</span>。
          </h1>
          <p>
            從生活的小問題開始，
            <br className="desktop-break" />
            一起看懂政府、選票，和每天遇見的資訊。
          </p>
          <div className="hero-actions">
            <LearningPathLink href="/learn/" contentId="quick-start" className="button-primary">
              從這裡開始認識
            </LearningPathLink>
            <Link href="/about/" className="hero-about">
              為什麼有這個計畫
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="hero-reassurance">
            <span>
              <Check size={15} />
              不需要公民基礎
            </span>
            <span>
              <Check size={15} />
              不用登入，隨時開始
            </span>
          </div>
        </div>
        <CivicPreviewView groups={CivicService.getPreviewGroups()} />
      </section>
      <div className="guide-strip">
        <div className="container">
          <span className="guide-strip-label">一點一點，理解我們的生活。</span>
          <span>
            <strong>{articles.length}</strong> 篇白話入門
          </span>
          <i />
          <span>
            <strong>{regions.counties.length}</strong> 縣市選票指南
          </span>
          <i />
          <span>
            <strong>6</strong> 個查證練習
          </span>
          <span className="strip-end">
            理解，是參與的第一步 <Sprout size={18} />
          </span>
        </div>
      </div>
      <section className="container home-paths section-space">
        <SectionHeading
          number="01"
          eyebrow="你想先了解什麼？"
          title="不用一次懂全部，從一個問題開始。"
          description="選一條路，照自己的步調往前。"
        />
        <div className="path-grid">
          <Link className="path-card path-learn" href="/learn/">
            <div className="path-card-top">
              <span className="path-no">01 / LEARN</span>
              <BookOpen size={28} />
            </div>
            <h3>
              政府到底
              <br />
              怎麼運作？
            </h3>
            <p>
              總統、市長、立委、議員……
              <br />
              用白話分清楚，誰做事、誰監督。
            </p>
            <div className="path-card-bottom">
              <span>5 分鐘快速入門</span>
              <span className="round-arrow">
                <ArrowUpRight size={21} />
              </span>
            </div>
          </Link>
          <Link className="path-card path-vote" href="/my-ballots/">
            <div className="path-card-top">
              <span className="path-no">02 / EXPLORE</span>
              <Vote size={29} />
            </div>
            <h3>
              我的一張票，
              <br />
              選出了什麼？
            </h3>
            <p>
              從你的戶籍地出發，
              <br />
              看懂中央與地方各有哪些民選職務。
            </p>
            <div className="path-card-bottom">
              <span>找到你的選票指南</span>
              <span className="round-arrow">
                <ArrowUpRight size={21} />
              </span>
            </div>
          </Link>
          <Link className="path-card path-media" href="/media-literacy/">
            <div className="path-card-top">
              <span className="path-no">03 / THINK</span>
              <ScanSearch size={29} />
            </div>
            <h3>
              這則訊息，
              <br />
              可以相信嗎？
            </h3>
            <p>
              先停一下，再多看一眼。
              <br />
              練習找來源、看脈絡、用證據判斷。
            </p>
            <div className="path-card-bottom">
              <span>來做一個查證練習</span>
              <span className="round-arrow">
                <ArrowUpRight size={21} />
              </span>
            </div>
          </Link>
        </div>
      </section>
      <section className="government-teaser">
        <div className="container teaser-grid">
          <div>
            <div className="eyebrow light">02 · 從生活連到制度</div>
            <h2>
              誰可以決定，
              <br />
              誰需要被監督？
            </h2>
            <p>
              你想改善的那個路口、家附近的公園、
              <br />
              新聞裡的一筆預算，都和制度有關。
            </p>
            <ActionLink href="/government/" secondary>
              打開政府關係圖
            </ActionLink>
          </div>
          <div className="teaser-questions">
            {[
              ['01', '總統會直接幫我修路嗎？', 'central-government'],
              ['02', '議員跟市長，到底差在哪？', 'local-government'],
              ['03', '預算通過了，工程就會動工嗎？', 'law-and-budget'],
            ].map(([n, title, slug]) => (
              <Link key={slug} href={`/learn/${slug}/`}>
                <span>{n}</span>
                <strong>{title}</strong>
                <ArrowUpRight size={20} />
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="container section-space">
        <SectionHeading
          number="03"
          eyebrow="把複雜的事，慢慢說清楚"
          title="今天，先多懂一點。"
          href="/learn/"
          linkLabel="全部入門主題"
        />
        <div className="article-preview-grid">
          {articles.slice(0, 3).map((article, i) => (
            <Link key={article.id} href={`/learn/${article.slug}/`} className="article-preview">
              <div className={`article-art art-${i}`} aria-hidden="true">
                {i === 0 ? (
                  <div className="art-rights">
                    <span>自由</span>
                    <span>法治</span>
                    <span>參與</span>
                  </div>
                ) : i === 1 ? (
                  <div className="art-branches">
                    <i />
                    <i />
                    <i />
                    <span>選舉 · 任命 · 監督</span>
                  </div>
                ) : (
                  <div className="art-local">
                    <span>縣</span>
                    <i>↔</i>
                    <span>市</span>
                    <i>↔</i>
                    <span>區</span>
                  </div>
                )}
                <small>公民筆記 / 0{i + 1}</small>
              </div>
              <div className="article-preview-meta">
                入門筆記<span>約 {article.minutes} 分鐘</span>
              </div>
              <h3>{article.title}</h3>
              <p>{article.summary}</p>
              <span className="text-link">
                一起看懂
                <ArrowRight size={16} />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <section className="container mission-section">
        <div className="mission-sprout">
          <Sprout size={40} />
        </div>
        <div>
          <div className="eyebrow">這個網站，為什麼存在？</div>
          <h2>讓理解多一點，讓距離少一點。</h2>
          <p>{site.developerIntent.paragraphs[0]}</p>
          <Link className="text-link" href="/about/">
            閱讀開發初衷
            <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="mission-stamp" aria-hidden="true">
          <span>KEEP ASKING</span>
          <strong>
            保持
            <br />
            好奇
          </strong>
          <span>KEEP LEARNING</span>
        </div>
      </section>
    </>
  );
}
