import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { resultStatus } from '../lib/resultStatus';
import { MARKET_TIMINGS } from '../lib/marketTiming';
import { faqSchema } from '../lib/faq';
import { nightFaqItems } from '../lib/nightFaq';
import type { LivePayload } from '../lib/live';
import type { Result } from '../lib/matka';
import Faq from '../components/Faq';
import ResultCard from '../components/ResultCard';
import NightFaqHead from '../components/NightFaqHead';
const route = vi.hoisted(() => ({ path: '/' }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }), usePathname: () => route.path }));
const record: Result = {date:'2026-11-16', status:'closed', openPana:'238',closePana:'490',jodi:'33',updatedAt:'2026-11-16T14:46:00.000Z'};
const payload = (status?: Result['status']): LivePayload => ({date:record.date,today:status?{...record,status}:null,yesterday:{...record,date:'2026-11-15'},latest:record,week:[]});

describe('IST result card status', () => {
  it('shows the confirmed open time before publication, without treating yesterday as today', () => {
    expect(resultStatus(payload(),record.date,1154)).toBe("Today's result opens at 7:15 PM IST");
    expect(resultStatus(payload('closed'),'2026-11-17',0)).toBe("Today's result opens at 7:15 PM IST");
  });
  it('does not invent an open or close just because the clock passes publication time', () => {
    expect(resultStatus(payload(),record.date,1155)).toBe("Waiting for today's open result");
    expect(resultStatus(payload('open'),record.date,1214)).toBe('Open is out · close at 8:15 PM IST');
    expect(resultStatus(payload('open'),record.date,1215)).toBe('Open is out · waiting for close');
    expect(resultStatus(payload('closed'),record.date,1216)).toBe('Result declared');
    expect(resultStatus(payload('holiday'),record.date,1216)).toBe('No result today');
  });
  it('uses the same central configuration for the Day market', () => {
    expect(resultStatus(payload(),record.date,694,MARKET_TIMINGS.day)).toBe("Today's result opens at 11:35 AM IST");
    expect(resultStatus(payload('open'),record.date,754,MARKET_TIMINGS.day)).toBe('Open is out · close at 12:35 PM IST');
  });
  it('renders a real saved timestamp and separates status from yesterday', () => {
    const html=renderToStaticMarkup(createElement(ResultCard,{initial:payload('closed'),initialMinutes:1216}));
    expect(html).toContain('dateTime="2026-11-16T14:46:00.000Z">Updated 8:16 PM IST</time>');
    expect(html.indexOf('Result declared')).toBeLessThan(html.indexOf('Yesterday:'));
    const invalid=payload('closed');invalid.today!.updatedAt='invalid';
    expect(renderToStaticMarkup(createElement(ResultCard,{initial:invalid,initialMinutes:1216}))).not.toContain('<time');
  });
});
describe('visible FAQ and head schema', () => {
  it('generates all questions and exact answers from the visible data, with the stored first date', () => {
    const items=nightFaqItems('2019-01-28');
    const schema=faqSchema(items);
    expect(items).toHaveLength(7);
    expect(items.at(-1)!.a).toContain('28 January 2019');
    const html=renderToStaticMarkup(createElement(Faq,{items,schema:false}));
    expect(html).not.toContain('application/ld+json');
    schema.mainEntity.forEach((entry,index)=>{
      expect(entry.name).toBe(items[index].q);
      expect(entry.acceptedAnswer.text).toBe(items[index].a);
      expect(html).toContain(items[index].a.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#x27;'));
    });
  });
  it('renders the Night FAQ head script only on the homepage', () => {
    const data=faqSchema(nightFaqItems('2019-01-28'));
    route.path='/';
    expect(renderToStaticMarkup(createElement(NightFaqHead,{data}))).toContain('application/ld+json');
    for(const path of ['/sridevi-chart/','/privacy-policy/','/missing/']) {
      route.path=path;
      expect(renderToStaticMarkup(createElement(NightFaqHead,{data}))).toBe('');
    }
    route.path='/';
  });
});
