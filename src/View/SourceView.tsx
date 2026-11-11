import { BookOpenCheck } from 'lucide-react';
import { SourceService } from '@/Service/SourceService';
import { SourceLink } from './TrackingView';
import type { SourceListProps } from '@/Model/SourceModel';
export function SourceList({
  sourceIds,
  compact = false,
  headingLevel: Heading = 'h2',
}: SourceListProps) {
  const sources = SourceService.resolve(sourceIds);
  return (
    <section className={`source-list ${compact ? 'compact' : ''}`}>
      <Heading>
        <BookOpenCheck size={21} />
        依據與延伸閱讀
      </Heading>
      <p className="muted">不只相信這個網站，也歡迎回到原始資料。</p>
      {sources.map((source) => (
        <div className="source-item" key={source.id}>
          <SourceLink source={source} />
          <small>
            {source.publisher} · 本站查核 {source.checkedAt}
          </small>
          {!compact && <p>{source.scope}</p>}
        </div>
      ))}
    </section>
  );
}
