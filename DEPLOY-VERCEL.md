# Vercel deployment with automatic file-based results

The running website reads `data/results.json`. It does not open or write SQLite.
All 2,823 original records were exported without changing their values; the old
SQLite files remain local backups. Commit the JSON file, not `.env.local` or the
database backups. Legacy import tools still exist for offline use.

## One-time activation

1. Create a GitHub repository and upload this project, including `data/results.json`,
   `package-lock.json`, and `.github/workflows/update-results.yml`. Keep the workflow
   at the repository root. Do not upload `node_modules`, `.next`, `.next-dev`,
   backup copies of `app`, local environment files, or database files.
2. Import that repository into Vercel. Use the Next.js preset; `vercel.json` supplies
   the validation/build command. Set `NEXT_PUBLIC_SITE_URL=https://sridevinightchart.com`
   and `NEXT_PUBLIC_CONTACT_EMAIL=sridevinightchart@gmail.com`. Do not set `DB_PATH`
   or `RESULTS_PATH`; no database credentials are needed. Do not run the updater
   inside the Vercel build or a Vercel cron function.
3. In Vercel Project Settings → Git → Deploy Hooks, create a hook for the production
   branch. Add its URL to GitHub Settings → Secrets and variables → Actions as the
   repository secret `VERCEL_DEPLOY_HOOK`. Never commit the hook URL.
4. Enable GitHub Actions and allow the workflow token to write repository contents.
   Branch protection must allow this workflow to push the result file, or a suitable
   narrowly scoped publishing credential must be configured by the repository owner.
5. Add GitHub repository variable `PUBLIC_SITE_URL=https://sridevinightchart.com`.
   Sources are restricted in lib/auto-fetch.ts to the two owner-approved pages:
   https://matka-tips.org/record-chart/sridevi-night-jodi and
   https://khabar.bet/sridevi-night-matka-chart . Environment variables cannot
   silently add other sources.
6. Connect the custom domain, DNS and TLS in Vercel. Both the apex and www hostnames
   need to reach the project. The application redirects the live HTTP/www variants
   to HTTPS non-www; development and Vercel preview URLs are not redirected.
7. Run the workflow once from GitHub Actions → Update published Sridevi Night results
   → Run workflow, and confirm its deployment verification step succeeds. This is
   the activation check; the schedule handles subsequent days without manual edits.

## Daily behavior

- Six scheduled checks run around/after the publication window and overnight, using
  UTC cron expressions. GitHub schedules may be delayed and are not exact timers.
- The updater fetches supported feeds, requires an explicit date and Sridevi Night
  identity, and checks panna order and the jodi calculation. It never assigns the
  current date to an undated number or invents a holiday for an absent result.
- Open-only records can be saved when a supported feed publishes a dated open
  record. The approved pages currently have undated live blocks; those blocks are not imported.
  Khabar also returned HTTP 403 to automated requests during the latest check.
  Until a supported recent date is available, automatic publication is blocked. Publication
  timing and availability depend on the source; this is not an official result feed.
- Settled historical full results are not rewritten. Future records are ignored.
  Conflicts affecting new results fail the run without saving changes. Recent
  missing dates can be filled during later checks; existing history remains intact.
- Valid changes are atomically saved, tested, committed, and pushed. The deploy hook
  publishes them. All page sections, charts, metadata and sitemap read that snapshot.
- The workflow verifies `/api/result/today/` against the committed snapshot version.
  A failed deployment is retried on a later scheduled run even if the result file
  has no further changes. A new record is not live until the deployment completes.
- If a source is unavailable or has not published a result, the existing records
  remain. Inspect workflow logs and enable GitHub failure notifications. Third-party
  layout changes can require parser maintenance; permanent zero-maintenance service
  cannot be guaranteed. GitHub may disable schedules on inactive public repositories.
- The final overnight run fails its freshness check if the previous IST date has no
  completed result or confirmed closure. This surfaces a missed update through
  workflow failure notifications rather than silently treating missing data as success.

## Local verification

```text
npm run validate-results
npm test
npm run update-results -- --dry
npm run build
```

`npm run update-results` writes validated results locally; `--dry` never saves.
The old `/api/cron/` mutation endpoint is disabled on Vercel. The original SQLite
backup is retained for comparison, not used by the deployed website.

Vercel Hobby eligibility, usage limits and GitHub Actions quotas still apply.
This design removes the database subscription; it does not promise unlimited
free hosting or waive Vercel's non-commercial Hobby restrictions.
