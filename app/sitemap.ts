import type { MetadataRoute } from 'next';
import * as repo from '@/lib/repo';
import { DAY_MODIFIED, dayLastUpdated } from '@/lib/day';
import { abs } from '@/lib/site';
import { INFO_PAGES, HOME_MODIFIED, infoModified } from '@/lib/pages';
export const revalidate = 3600;
export default function sitemap(): MetadataRoute.Sitemap {
  const updated = [repo.lastUpdated() ?? '', HOME_MODIFIED].sort().at(-1)!;
  return [
    { url: abs('/'), lastModified: updated, changeFrequency: 'daily', priority: 1 },
    { url: abs('/sridevi-chart/'), lastModified: [DAY_MODIFIED, dayLastUpdated() ?? ''].sort().at(-1)!, changeFrequency: 'daily', priority: 0.9 },
    ...Object.keys(INFO_PAGES).map((slug) => ({ url: abs(`/${slug}/`), lastModified: infoModified(slug), changeFrequency: 'yearly' as const, priority: 0.3 })),
  ];
}
