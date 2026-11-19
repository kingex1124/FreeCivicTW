import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { SeoService } from '@/Service/SeoService';
import type { BreadcrumbProps, SeoDocumentProps } from '@/Model/SeoModel';

// Server components: shared client UI must not import the full SEO/content catalog.
export function StructuredData({ path, details }: SeoDocumentProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: SeoService.json(SeoService.structuredData(path, details)),
      }}
    />
  );
}

export function Breadcrumbs({ path }: BreadcrumbProps) {
  const items = SeoService.breadcrumbs(path);
  return (
    <nav className="breadcrumbs" aria-label="頁面路徑">
      <ol>
        {items.map((item, index) => (
          <li key={item.path}>
            {index > 0 && <ChevronRight size={16} aria-hidden="true" />}
            {index === items.length - 1 ? (
              <span aria-current="page">{item.name}</span>
            ) : (
              <Link href={item.path}>{item.name}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
