import { StructuredData, Breadcrumbs } from '@/View/SeoView';
import { PageIntro } from '@/View/SiteView';
import { ElectionView } from '@/View/ElectionView';
import { SeoService } from '@/Service/SeoService';
import { ElectionService } from '@/Service/ElectionService';
import { SourceService } from '@/Service/SourceService';
export const metadata = SeoService.metadataFor('/my-ballots/');
export default function BallotsPage() {
  return (
    <>
      <StructuredData
        path="/my-ballots/"
        details={{
          learningResourceType: '選舉制度指南',
          citation: SourceService.resolve(ElectionService.getRules().sourceIds).map(
            (source) => source.url,
          ),
        }}
      />
      <PageIntro
        breadcrumbs={<Breadcrumbs path="/my-ballots/" />}
        eyebrow="我的選票指南 / FIND YOUR VOICE"
        title="我的一張票，選出了什麼？"
        description="從戶籍地出發，分開看中央與地方的民選職務。這是制度指南，實際投票資格仍依當次選務公告。"
      />
      <ElectionView />
    </>
  );
}
