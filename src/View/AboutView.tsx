import { Mail, ArrowUpRight, Sprout, ShieldCheck } from 'lucide-react';
import { SiteService } from '@/Service/SiteService';
import { ActionLink } from './SiteView';
import { CopyEmailButton } from './ContactView';
export function AboutView() {
  const site = SiteService.get();
  return (
    <div className="container reading-wide section-bottom">
      <section className="about-letter">
        <div className="letter-symbol">
          <Sprout size={37} />
        </div>
        <span className="eyebrow">寫給每一個願意多了解一點的人</span>
        <h2>{site.developerIntent.title}</h2>
        {site.developerIntent.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
        <div className="letter-signature">FreeCivicTW · 公民自由課</div>
      </section>
      <section className="about-principles">
        <h2>我們希望怎麼說清楚</h2>
        <ol>
          {site.editorialPrinciples.map((p, i) => (
            <li key={i}>
              <span>0{i + 1}</span>
              {p}
            </li>
          ))}
        </ol>
      </section>
      <section className="contact-box" id="contact">
        <Mail size={29} />
        <h2>讓內容更好，一起來。</h2>
        <p>如果有需要更正的地方、功能建議，或想一起做些什麼，歡迎來信。</p>
        <a className="email-address" href={site.contact.mailto}>
          {site.contact.email}
          <ArrowUpRight size={21} />
        </a>
        <div className="contact-actions">
          <a href={SiteService.correctionLink('/about/')} className="button-primary">
            提出內容更正
            <Mail size={17} />
          </a>
          <CopyEmailButton />
        </div>
        <p className="muted">
          更正來信可附頁面網址、疑似問題與參考來源。請不要提供身分證、戶籍證明或投票選擇。
        </p>
      </section>
      <div className="notice">
        <ShieldCheck />
        <p>{site.notices.educationalPurpose} 本站不提供政黨或候選人投票推薦。</p>
      </div>
      <ActionLink href="/sources/" secondary>
        查看資料來源與更正紀錄
      </ActionLink>
    </div>
  );
}
export function PrivacyView() {
  return (
    <div className="container reading-wide section-bottom">
      <article className="prose-card">
        <h2>先說你最在意的事</h2>
        <p>
          你不需要登入，也不需要提供姓名、身分證、生日或完整地址。地區查詢與練習答案只留在當次頁面操作中，關閉或重新整理後不保存。
        </p>
        <h2>網站使用統計</h2>
        <p>
          正式網站會自動透過 Google Tag 載入 Google Analytics
          4（GA4），用於了解網站使用情況、改善教學內容。
        </p>
        <h2>會記錄什麼，不會記錄什麼</h2>
        <p>
          我們可能觀察頁面瀏覽、課程及練習完成、角色卡開啟等行為，使用公開的內容 ID。GA4 可能使用
          Cookie，並處理裝置、瀏覽器、IP 位址及大致位置等技術資訊；GA4 不記錄或儲存 IP
          位址。詳情可參考 Google 的隱私說明。
        </p>
        <p>
          本站自訂分析事件不包含你選擇的戶籍地、原住民教學情境、輸入文字、答題答案、個人分數或來信內容。請不要在網址中加入身分或其他敏感資料。
        </p>
        <h2>裝置上的偏好資料</h2>
        <p>
          深色／淺色模式的偏好會保存在瀏覽器的
          localStorage，方便下次沿用。瀏覽器限制儲存時，網站仍可使用，但設定可能無法跨次保留。
        </p>
        <p>
          GA4 可能建立分析 Cookie。你可以使用瀏覽器設定管理或清除 Cookie，也可參考{' '}
          <a
            href="https://tools.google.com/dlpage/gaoptout?hl=zh-TW"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Analytics 停用瀏覽器外掛程式
          </a>
          。
        </p>
        <h2>聯絡與外部來源</h2>
        <p>
          聯絡按鈕會開啟你的郵件軟體，由你自行編輯及寄送。外部官方資料頁有各自的隱私政策；瀏覽外部來源前，請自行留意。
        </p>
        <p>
          <a
            href="https://policies.google.com/privacy?hl=zh-TW"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google 隱私權政策
          </a>
        </p>
        <p>
          此頁更新：2026-11-13。若有疑問，請聯絡{' '}
          <a href={SiteService.get().contact.mailto}>{SiteService.get().contact.email}</a>。
        </p>
      </article>
    </div>
  );
}
