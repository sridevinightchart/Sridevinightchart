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

- Target polling is every five minutes from 7:15 PM through 8:30 PM IST
  (13:45?15:00 UTC). GitHub schedules can be delayed or dropped; a delayed run
  outside the window does not assign an undated result to that day.
- Only the actual live hero sections on the two exact approved URLs are read.
  Advertisements, guessing blocks, historic table values and article publication
  dates are excluded. No other source is used as a fallback.
- Both sites must return a valid Sridevi Night result. Their open pannas must
  agree. A close is saved only when both sites show the same validated close;
  a shared valid open can be saved while one site still awaits its close.
- The owner has authorized dating undated live results by this publication
  window. This is an inference, not an explicit source date or proof of accuracy.
  Saved records include provenance stating that basis and the two source URLs.
- To avoid relabeling yesterday's carried-over number, an unchanged previous
  full result is withheld. An open matching the previous open is also withheld
  until a different completed result is confirmed. A genuine identical repeat
  cannot be distinguished from stale data by these pages alone and is withheld.
- Outages, invalid numbers, mismatches and conflicts with today's saved result
  leave existing records untouched. Settled historical results are not rewritten.
- Valid changes are saved atomically, tested, committed and pushed. The Vercel
  deploy hook then publishes the new snapshot. The live result API is checked
  against the committed version; later runs retry a failed deployment.
- Visitors retain the latest declared result with its actual date until a new
  one is saved. The card and charts refresh when a new deployment is detected.
- An overnight run checks whether the previous IST day has a completed result
  or confirmed closure. Missing data fails that check rather than inventing a
  holiday. Enable GitHub workflow failure notifications for missed updates.
- The deploy-hook secret is required to activate publishing. GitHub may disable
  schedules in inactive public repositories. Source markup changes can require
  parser maintenance. No exact publication latency or absolute source accuracy
  is guaranteed by this arrangement.

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
