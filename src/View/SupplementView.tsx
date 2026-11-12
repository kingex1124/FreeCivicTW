import Link from 'next/link';
import { ArrowDown, ArrowUpRight, MessagesSquare, Scale, Vote } from 'lucide-react';
import type { SupplementViewProps } from '@/Model/SupplementModel';
import { IndigenousElectionView } from './IndigenousElectionView';
import { TopicContentView } from './TopicContentView';

export function SupplementView({ data, indigenous }: SupplementViewProps) {
  const icons = {
    'political-debate': MessagesSquare,
    'constitutional-court': Scale,
  };
  const links = [
    { id: 'indigenous-guide', title: '原住民選舉', text: '中央、地方的選票與資格比較', Icon: Vote },
    ...data.topics.map((topic) => ({
      id: topic.id,
      title: topic.shortTitle,
      text: topic.navDescription,
      Icon: icons[topic.id],
    })),
  ];
  return (
    <div className="container more-layout">
      <nav id="more-topics" className="more-topic-nav" aria-label="補充主題">
        <h2>想多了解哪一題？</h2>
        <p>選一個主題，直接跳到說明。</p>
        <div>
          {links.map(({ id, title, text, Icon }) => (
            <a key={id} href={`#${id}`}>
              <Icon size={23} aria-hidden="true" />
              <span>
                <strong>{title}</strong>
                <span>{text}</span>
              </span>
              <ArrowDown size={18} aria-hidden="true" />
            </a>
          ))}
        </div>
        <p className="more-nav-note">不必一次讀完。每一節都能點開、收起；手機也可以直接閱讀。</p>
      </nav>
      <div className="more-content">
        <IndigenousElectionView {...indigenous} />
        <div className="more-next-links">
          <Link className="text-link" href="/my-ballots/">
            到我的選票指南查民選職務 <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
          <a className="text-link" href="#more-topics">
            回到主題選擇 ↑
          </a>
        </div>
        {data.topics.map((topic) => (
          <TopicContentView
            key={topic.id}
            topic={topic}
            checkedAt={data.checkedAt}
            returnLink={{ href: '#more-topics', label: '回到主題選擇 ↑' }}
          />
        ))}
      </div>
    </div>
  );
}
