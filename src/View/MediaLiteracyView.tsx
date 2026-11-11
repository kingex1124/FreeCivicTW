import Link from 'next/link';
import {
  ArrowRight,
  ScanSearch,
  FileText,
  Clock3,
  Quote,
  ChartColumn,
  Network,
  Image,
} from 'lucide-react';
import { MediaLiteracyService } from '@/Service/MediaLiteracyService';
export function MediaLiteracyIndexView() {
  const data = MediaLiteracyService.get();
  const icons = [FileText, Clock3, Quote, ChartColumn, Network, Image];
  return (
    <div className="container section-bottom">
      <section className="media-method">
        <div>
          <span className="eyebrow">相信之前，先保留一點好奇</span>
          <h2>
            查證不是天賦，
            <br />
            是一個可以練習的習慣。
          </h2>
          <p>
            不是每個問題都能立刻判斷真假。
            <br />
            知道自己還缺什麼證據，也是一種能力。
          </p>
        </div>
        <ol>
          {[
            '停一下，不急著轉傳',
            '找原始來源與發布者',
            '看日期、條件與完整脈絡',
            '分辨事實、意見與證據',
            '找獨立資料交叉核對',
            '證據不足，暫不下結論',
          ].map((text, i) => (
            <li key={text}>
              <span>0{i + 1}</span>
              {text}
            </li>
          ))}
        </ol>
      </section>
      <div className="section-heading">
        <div>
          <div className="eyebrow">六個情境，練習六種眼光</div>
          <h2>先從一則訊息開始。</h2>
          <p>虛構素材，真實可用的方法。沒有計時，也不需要得滿分。</p>
        </div>
      </div>
      <div className="scenario-grid">
        {data.scenarios.map((s, i) => {
          const Icon = icons[i];
          return (
            <Link key={s.id} href={`/media-literacy/${s.slug}/`} className="scenario-card">
              <div className="scenario-card-top">
                <span className="eyebrow">練習 {String(i + 1).padStart(2, '0')}</span>
                <Icon size={27} />
              </div>
              <span className="pill">{s.skill}</span>
              <h3>{s.title}</h3>
              <p>{s.claimToCheck}</p>
              <span className="text-link">
                開始練習
                <ArrowRight size={16} />
              </span>
            </Link>
          );
        })}
      </div>
      <div className="notice media-disclaimer">
        <ScanSearch size={25} />
        <div>
          <strong>練習查證方法，不替所有新聞蓋章。</strong>
          <p>{data.disclaimer} 來源身分與轉傳次數，都不能單獨當作真實保證。</p>
        </div>
      </div>
    </div>
  );
}
