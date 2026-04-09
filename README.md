# Yield Curves Dashboard (Static, GitHub Pages)

A single-page dashboard that shows three sovereign yield curve charts:

1. **United States Treasury Curve**
2. **Euro Area Government Par Curve**
3. **Japan Government Bond Curve**

Each chart overlays four snapshots (Current / 1 week ago / 1 month ago / 1 year ago), supports clickable legends, and can export CSV and PNG.

## What makes this “static” (no backend)

This project is intentionally built as a **static site**:

- **GitHub Actions** fetches official data once per weekday, normalizes it, and writes JSON files into `public/data/`.
- Those JSON files are **committed into the repo**.
- The deployed website (GitHub Pages) loads **only local JSON** from `/<base>/data/*.json`.
- There is **no runtime browser fetching from third-party data sources** and **no backend server** required.

This architecture is beginner-friendly: if anything looks wrong, you can open `public/data/*.json` and inspect exactly what the site is rendering.

## Data sources (official)

One official source family per market:

- **United States:** U.S. Treasury “Daily Treasury Par Yield Curve Rates”
- **Euro area:** ECB euro-area yield curve dataset (model-derived par yields, **all ratings included**)
- **Japan:** Ministry of Finance Japan “JGB Interest Rate” CSV (official fixed-tenor series)

## Local development

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

The site reads JSON from `public/data/`. If you haven’t refreshed data yet, the charts may show “Data unavailable”.

## Refresh data locally (writes JSON)

Run the data pipeline:

```bash
npm run data:update
```

This fetches official source data, builds the 4 snapshot overlays per market, and writes:

- `public/data/metadata.json`
- `public/data/us.json`
- `public/data/euro.json`
- `public/data/japan.json`

## Build and preview locally

Build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## GitHub Actions: what runs, and when

There are two workflows in `.github/workflows/`:

### 1) `data-refresh.yml` (weekday scheduled + manual)

- Runs once per weekday (schedule is in **UTC**).
- Also supports manual runs via **Actions → Data refresh → Run workflow**.
- Runs `npm ci` then `npm run data:update`.
- If `public/data/*.json` changed, it commits and pushes back to `main`.
- If one market fails, it keeps the last successful JSON for that market and marks it as stale in `metadata.json`.
- The job fails only if **all three markets fail**.

### 2) `deploy-pages.yml` (deploy on push to main)

- Runs on every push to `main`.
- Builds the Vite site and deploys it to GitHub Pages using the official Pages actions.
- Sets the Vite base path automatically to `/<repo-name>/` so project-site URLs work.

## GitHub Pages setup (step by step)

1. Create a **public** GitHub repository (public repos get free Pages + Actions on GitHub).
2. Push this project to the repo’s `main` branch.
3. In GitHub, go to **Settings → Pages**.
4. Set **Source** to **GitHub Actions**.
5. Wait for the workflows to run (Actions tab).
6. Open:

`https://<username>.github.io/<repo-name>/`

## Base path (project-site deployment)

This app is designed for GitHub Pages “project-site” URLs like:

`https://<username>.github.io/<repo-name>/`

The workflow sets:

- `VITE_BASE_PATH=/<repo-name>/`

Locally, you can simulate this by building with:

```bash
VITE_BASE_PATH=/your-repo-name/ npm run build
```

## Troubleshooting

- **Charts show “Data unavailable”**
  - Run `npm run data:update` and confirm `public/data/*.json` contains snapshots.
- **GitHub Action can’t push commits**
  - Confirm the workflow has `permissions: contents: write` (it does by default here).
  - Confirm your repo uses the `main` branch (or update workflow triggers).
- **Page loads but assets 404 on GitHub Pages**
  - This almost always means the base path is wrong.
  - Confirm Pages is deployed as a project site and `VITE_BASE_PATH` is set to `/<repo-name>/`.

## Methodology caveats (important)

These curves are not identical instruments:

- The **U.S.** curve uses Treasury **par yield curve nodes** (official fixed maturities).
- The **Euro area** curve uses ECB **model-derived par yields** for the euro area (all ratings included).
- The **Japan** curve uses MOF official **fixed-tenor** JGB yields (1Y and longer in v1).

Snapshot dates use the nearest prior available business day for each offset. Markets have different holiday calendars and publication schedules, so snapshot “actualDate” can differ by market.

## Moving to a custom domain later

GitHub Pages supports custom domains. When you’re ready:

1. Add your domain in **Settings → Pages**.
2. Create the required DNS records.
3. Update `VITE_BASE_PATH` to `/` (root) for that deployment style.
