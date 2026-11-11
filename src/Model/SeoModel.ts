export type SeoInput = {
  title: string;
  description: string;
  path: string;
  type?: 'website' | 'article';
  updatedAt?: string;
  noIndex?: boolean;
};
export type JsonLdProps = { value: Record<string, unknown> };
