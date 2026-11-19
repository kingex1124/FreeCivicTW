import { HomeView } from '@/View/HomeView';
import { SeoService } from '@/Service/SeoService';
import { StructuredData } from '@/View/SeoView';
export const metadata = SeoService.metadataFor('/');
export default function HomePage() {
  return (
    <>
      <StructuredData path="/" />
      <HomeView />
    </>
  );
}
