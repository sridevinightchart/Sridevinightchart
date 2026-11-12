import type { MetadataRoute } from 'next';
import * as repo from '@/lib/repo';
import { abs } from '@/lib/site';
import { INFO_PAGES, EDITORIAL_MODIFIED } from '@/lib/pages';
export const revalidate = 3600;
export default function sitemap(): MetadataRoute.Sitemap {
  const updated = [repo.lastUpdated() ?? '', EDITORIAL_MODIFIED].sort().at(-1)!;
  return [
    { url: abs('/'), lastModified: updated, changeFrequency: 'daily', priority: 1 },
    ...Object.keys(INFO_PAGES).map((slug) => ({ url: abs(`/${slug}/`), lastModified: EDITORIAL_MODIFIED, changeFrequency: 'yearly' as const, priority: 0.3 })),
  ];
}
