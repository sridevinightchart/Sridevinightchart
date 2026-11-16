'use client';
import { usePathname } from 'next/navigation';
import JsonLd from './JsonLd';
import type { faqSchema } from '@/lib/faq';

// Server-render in <head>, and remove it on navigation to another market/page.
// No request headers or dynamic rendering are needed for otherwise static pages.
export default function NightFaqHead({ data }: { data: ReturnType<typeof faqSchema> }) {
  return usePathname() === '/' ? <JsonLd data={data} /> : null;
}
