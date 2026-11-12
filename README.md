> Current deployment: the website now reads JSON files. See [DEPLOY-VERCEL.md](DEPLOY-VERCEL.md) for the Vercel and automatic-update setup. SQLite instructions below are retained for legacy offline tools.

# Sridevi Night Chart

A fast, results-only website for the keyword "sridevi night chart": live result card, jodi chart, panel chart and yearly archives. Built with Next.js 14 (App Router), TypeScript, Tailwind CSS and SQLite.

No betting links, no app downloads, no tips or predictions. Every number comes from your CSV import or the admin form.

## Requirements

- Node.js 20 (LTS)
- A Linux VPS with Nginx (for production)

## 1. Setup

```bash
npm install
cp .env.example .env.local     # then edit the values
```

| Variable | What it does |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Your live domain, no trailing slash (used for canonical URLs, sitemap, schema) |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Email shown on About and Contact pages |
| `ADMIN_PASSWORD` | Password for `/admin/`. Use a long random string |
| `SESSION_SECRET` | Signs the admin login cookie. Another long random string |
| `DB_PATH` | Optional. SQLite file location (default `./data/sridevi-night.db`) |

Generate random strings with: `openssl rand -hex 32`

## 2. Import the historical data

Put your full record in `data/sridevi-night.csv`:

```
date,open_pana,jodi,close_pana
2026-11-09,790,62,200
2026-11-10,238,33,490
2026-08-15,***,**,***
```

- Dates can be `YYYY-MM-DD` or `DD-MM-YYYY`.
- Use `***,**,***` for a day with no result (holiday).
- The included file already holds 107 real results (27 Jul – 10 Nov 2026). Add older rows above them to extend the archive back to 2019.

```bash
npm run import -- --dry   # validate only, writes nothing
npm run import            # validate and import
```

Every row is checked: each pana must be valid (digits in order, with 0 counted as 10) and the jodi must match the two panas. Problem rows are listed with line numbers and are **not** imported. Fix them and run again; re-importing is safe (existing dates are updated, not duplicated).

## 3. Run locally

### Historical panel recovery

The panel history snapshots in `data/panel-source*.html` were downloaded from
https://kalyanchart.cyou/sridevi-night-panel-chart/ (pages 1–16).
Run `npx tsx scripts/import-panel-history.ts --dry` to validate them, or omit
`--dry` to import. The importer creates a SQLite backup first, preserves existing
records with pannas, and requires valid pannas whose digit sums match the jodi.
Rejected records are listed in `data/panel-import-rejected.txt`.

Use dated panel records instead of `scripts/import-jodi-web.ts`: that legacy
importer discards nested/holiday cells and assigns the remaining values to
consecutive dates, which shifts historical results. Unknown pannas cannot be
derived from a jodi and remain `***`. Source validation checks internal numeric
consistency; it does not independently establish the authenticity of a result.

```bash
npm run dev               # http://localhost:3000
npm test                  # unit tests for the matka logic
```

## 4. Entering results every night

1. Open `https://your-domain/admin/` and log in.
2. Around 7:15 PM IST, enter the **open pana** and press **Save result**. The site shows `238-3*-***`.
3. Around 8:15 PM IST, enter the **close pana** and save again. The jodi is calculated for you.
4. For a day with no result, tick **No result this day**.

Saving updates every page within seconds (homepage, charts, year archive, sitemap). Visitors with the page open get the new result automatically: the result card checks every 30 seconds between 7:05 PM and 8:45 PM IST.

Use **Edit** / **Delete** in the "Last 14 entries" table to fix mistakes.

## 5. Deploy on a VPS (PM2 + Nginx)

```bash
# on the server
git clone <your-repo> /var/www/sridevi-night && cd /var/www/sridevi-night
npm ci
cp .env.example .env.local && nano .env.local
npm run import
npm run build
npm install -g pm2
PORT=3000 pm2 start npm --name sridevi-night -- start
pm2 save && pm2 startup
```

Nginx site config (`/etc/nginx/sites-available/sridevi-night`):

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;

    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/sridevi-night /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d your-domain.com -d www.your-domain.com   # HTTPS
```

Back up the database regularly (it is one file): `cp data/sridevi-night.db backups/$(date +%F).db`

### Updating the code later

```bash
git pull && npm ci && npm run build && pm2 restart sridevi-night
```

## Project structure

```
app/
  page.tsx                          Homepage (result card, 12-week charts, archive, how to read, timings, FAQ)
  sridevi-night-jodi-chart/         Full jodi chart (current + previous year)
  sridevi-night-panel-chart/        Full panel chart (current + previous year)
  sridevi-night-result-today/       Live result + last 7 days
  sridevi-night-chart/[year]/       Yearly archive with jodi/panel switch
  admin/                            Password-protected result entry
  api/result/today/                 JSON used by the live result card
  about, contact, disclaimer, privacy-policy/
  sitemap.ts, robots.ts, opengraph-image.tsx
components/                         Header, Footer, ResultCard, Charts, ChartControls, FAQ, etc.
lib/
  matka.ts                          Ank, jodi, pana validation, week grouping (unit tested)
  time.ts                           All date/time logic in IST (Asia/Kolkata)
  repo.ts                           Database access (swap this file to move to Postgres)
  db.ts, auth.ts, live.ts, site.ts  Database setup, admin auth, live payload, site settings
scripts/import.ts                   CSV import with validation report
tests/matka.test.ts                 Unit tests
data/sridevi-night.csv              Seed data
```

## Changing settings

### SEO and information pages

Production origin: https://sridevinightchart.com (HTTPS, non-www).
The page registry in lib/pages.ts covers About Us, Contact Us, Privacy Policy,
Disclaimer, and Terms and Conditions. Each page has its own metadata and schema;
the sitemap includes the homepage and those five routes. Unknown URLs return
404 with noindex. HTTP and www requests on the production domain redirect to
HTTPS non-www; configure DNS and a valid certificate for both hostnames at the
hosting provider before deployment. Local development is excluded from those
redirects.

Update EDITORIAL_MODIFIED in lib/pages.ts when editorial content changes. The
homepage and sitemap use the later of that timestamp and the database update.
No original publication date is invented. Retain the date if an unchanged page
is redeployed. Contact uses NEXT_PUBLIC_CONTACT_EMAIL.

Older records are server-rendered in expandable yearly tables under the archive.
Current-year charts remain interactive. Chart data is not an independent
verification of source authenticity. The legal pages describe the current code;
review hosting log practices and update the privacy notice if analytics, ads,
forms or new providers are introduced.

Run npm test and npm run build before release, then verify the actual deployed
URLs, image, redirects, sitemap and robots. Use Search Console URL Inspection and
Bing Webmaster Tools after launch; a local build does not establish deployment
or measured mobile Core Web Vitals.

Market timings, site name and polling window are in `lib/site.ts`. Colors are CSS variables at the top of `app/globals.css` (light and dark themes).
