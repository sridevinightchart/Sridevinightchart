# Automatic Day and Night results

## Live display and permanent history

Both result APIs and both server-rendered pages use `lib/currentResults.ts`. Approved source observations are trimmed to today and the previous two days before entering the 30-second server cache, separately by market and IST date. A new cache key avoids reading old multi-year entries. Cards poll every 30 seconds while awaiting publication or a pending close, every five minutes outside publication windows, and every fifteen minutes after completion. A local 15-second timer detects IST date/window transitions. A pending close from yesterday keeps fast polling after midnight. Focus/visibility changes also refresh. No database, paid scheduler, browser-side scraping, or writable Vercel disk is required.

The current source-agreed records are merged in memory with the saved snapshot. The hero, current-week strip, jodi chart and panel chart use that same merged data. On an upstream error or conflict, saved records remain visible with their original dates. Reliable saved full results skip source and Runtime Cache access before publication or after completion. Missing previous results, incomplete pannas and pending closes do not qualify. APIs report `sourceStatus` (saved, checked or unavailable) and `sourceCheckedAt` for diagnostics; `checked` means source checks succeeded, not that a new result has necessarily appeared.

The GitHub workflow checks Day around its 11:35 AM–12:35 PM IST publication period, Night from 7:15 PM through late evening, plus hourly catch-up runs. It saves validated records to `data/sridevi-day.json` and `data/results.json`, independently. An unavailable source for one market does not block validated changes in the other. After committing, it requests deployment only if needed and verifies **both** committed versions through the lightweight `/api/result/snapshot/` endpoint without touching live caches. A separate stable content `version` prevents identical live observations from causing repeated page refreshes.

GitHub schedules can be delayed or skipped. The live read path removes that timing dependency for visitors, while dated catch-up protects history when a scheduled run starts late. Source availability and publication remain external dependencies; no system can guarantee an update before trustworthy sources publish it.

## Exact sources

Night:
- https://matka-tips.org/record-chart/sridevi-night-jodi
- https://khabar.bet/sridevi-night-matka-chart

Day:
- https://matka-tips.org/record-chart/sridevi-jodi
- https://sattamatkajodi.com/record/sridevi-satta-penal-chart.php

The Khabar page loads its latest-year panel through `/ajax/mumbai-panel-chart.php` with its own SRIDEVI NIGHT game ID `731`. The updater checks that binding before using the fragment. The endpoint's generic filename does not identify the market; the verified parent page and game ID do.

## Date and number safeguards

- Explicit weekly panel dates anchor catch-up records; only the last two days plus today are considered automatically.
- Another source must corroborate the numbers. Disagreeing dated records are withheld.
- Undated hero numbers can become today's result only during the market's publication window, from two fresh observations made after that window opened. Day uses 11:35 AM–3:00 PM IST; Night uses 7:15 PM–11:59 PM IST.
- A caught-up dated result becomes the stale-result baseline before assigning any undated number. Yesterday's number cannot be copied forward merely because an earlier snapshot was missing it.
- Panna ordering and digit sums must validate the jodi. Open-only publications retain an unknown close.
- Matching yesterday's result is withheld unless an explicit dated publication corroborates a real repeat.
- Future dates are rejected. Closed historical full results are not silently rewritten. Conflicting current records are rejected.
- Empty or starred current cells alone do not establish a holiday; closures are never invented to make a freshness check pass.

## Verification and operations

`npm run update-results -- --dry` checks both sources without writing. `npm run validate-results` validates both snapshots. `npm test` includes source isolation, stale/pre-window caches, open-to-close progression, source conflicts, midnight catch-up and stable-version checks.

`VERCEL_DEPLOY_HOOK` remains a GitHub repository secret; `PUBLIC_SITE_URL` is the public production domain. No provider credentials are included in the browser bundle. The deployment verifier checks persisted versions, not just a successful hook response or a live overlay.

The Night outage review found early parsing failures, the previous 8:30 PM cutoff excluding delayed runs, and a later scheduled job arriving after midnight and doing no fetch. The shared pipeline accepts corroborated dated catch-up outside publication windows and displays live verified changes independently of GitHub execution timing.

## CDN delivery and history

The public live APIs use a 10-second Vercel CDN cache. Browser freshness stays at zero and downstream CDN caching is disabled to avoid layering long stale windows. Client fetches use the browser default cache mode so they do not force a cache-bypass request. Duplicate in-flight refreshes are suppressed. The final CDN HIT behavior and billing savings must be verified after deployment; local tests validate headers and functionality only.

`npm run build` generates content-addressed JSON files under `public/chart-data/`. Historical year selections use these static CDN files, not Runtime Cache or new HTML pages. The current calendar/ISO years remain server-rendered and share one client data provider between jodi and panel charts. Older years load when selected; both charts share the same download. The existing year bars, All option, hash links and date search are preserved, with retry handling for failed archive requests. Around New Year both relevant ISO/calendar years stay live. Archive filenames exclude observation metadata and time-dependent future/pending states.

The main page URLs, headings, metadata and page structure remain unchanged. Whole-page ISR was not enabled for the large live pages: it would introduce separate ISR usage and risk stale live HTML. This implementation makes the historical data static while retaining server-rendered live content.

## Local optimization measurements

Before optimization, saved source samples produced cache payloads of about 368 KB (Day) and 131 KB (Night). Fresh compact source checks during validation produced 589 bytes (Day) and 576 bytes (Night), comfortably below an 8 KB read unit before framework overhead. These are payload measurements, not an account-level billing measurement.

Production-mode local HTML measured 390,405 bytes for Night and 368,619 bytes for Day, versus earlier saved responses of about 1.65 MB and 1.75 MB. Both pages passed mobile tests for year selection, All, shared archive downloads and ISO-boundary date search. Actual sizes vary with the current year/data.

Google Tag Manager container `GTM-M34V85S6` is installed site-wide with its standard bootstrap and noscript fallback. The CSP allows GTM and Analytics endpoints. Google Analytics collection depends on tags configured and published inside that container. Microsoft Clarity remains installed separately; check the GTM container before adding duplicate Clarity or Analytics tags there.
