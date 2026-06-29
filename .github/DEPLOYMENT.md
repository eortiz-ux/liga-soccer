# Deployment Guide

## Option 1 — Netlify Drop (fastest, no account needed)
1. Run `npm run build`
2. Go to netlify.com/drop
3. Drag the `build/` folder onto the page
4. Copy your live URL

## Option 2 — Netlify + GitHub (auto-deploys on every push)
1. Push this repo to GitHub
2. Go to netlify.com → New site from Git
3. Connect your GitHub repo
4. Build command: `npm run build`
5. Publish directory: `build`
6. Add environment variable: `REACT_APP_SHEETS_WEBHOOK` = your /exec URL
7. Deploy

## Option 3 — Vercel
1. Push to GitHub
2. Go to vercel.com → Import project
3. It auto-detects React — just click Deploy
4. Add `REACT_APP_SHEETS_WEBHOOK` in project settings → Environment Variables

## Google Sheets Setup
1. Open his Google Sheet → Extensions → Apps Script
2. Paste the `doPost` function code
3. Deploy → New deployment → Web app → Anyone → Deploy
4. Copy the `/exec` URL
5. Add it as `REACT_APP_SHEETS_WEBHOOK` in your deployment settings
