import { z } from 'zod';

export const SeoCatalogSchema = z.object({
  schemaVersion: z.literal(1),
  pages: z.array(
    z.object({
      path: z.string().regex(/^\/(?:[a-z0-9-]+\/)*$/),
      label: z.string().min(1),
      title: z.string().min(1),
      description: z.string().min(1),
      schemaType: z.enum(['WebSite', 'CollectionPage', 'LearningResource', 'AboutPage', 'WebPage']),
    }),
  ),
});
export type SeoCatalogPage = z.infer<typeof SeoCatalogSchema>['pages'][number];
export type SeoPage = Omit<SeoCatalogPage, 'schemaType'> & {
  schemaType: SeoCatalogPage['schemaType'] | 'Article';
  updatedAt: string;
};
export type BreadcrumbItem = { name: string; path: string };
export type BreadcrumbProps = { path: string };
export type SeoDocumentProps = { path: string; details?: Record<string, unknown> };

export type SeoInput = {
  title: string;
  description: string;
  path: string;
  type?: 'website' | 'article';
  updatedAt?: string;
  noIndex?: boolean;
};
export type JsonLdProps = { value: Record<string, unknown> };
