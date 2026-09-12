# Demo Pipeline App

A small internal tool for the sales team to log school demo details (past,
present, upcoming) and for the IT team to see what's coming up. Data is
stored in Airtable; the frontend never talks to Airtable directly — it only
talks to this app's own backend, which holds the Airtable credentials.

```
Browser  <-- fetch -->  This server (Express)  <-- Airtable API -->  Airtable base
(no secrets here)         (holds the token)
```

## 1. Install dependencies

Requires Node.js 18+.

```bash
npm install
```

## 2. Add your Airtable credentials

```bash
cp .env.example .env
```

Open `.env` and fill in:

- `AIRTABLE_TOKEN` — a Personal Access Token from
  https://airtable.com/create/tokens, scoped to `data.records:read` and
  `data.records:write`, with access limited to only the "Demo Pipeline" base.
- `AIRTABLE_BASE_ID` — the ID of your "Demo Pipeline" base (starts with `app`).

`AIRTABLE_TABLE_ID` is already pre-filled with the "Demos" table's ID and
usually doesn't need to change.

**Never commit `.env` or paste its contents anywhere public** — it's already
excluded via `.gitignore`.

## 3. Run it

```bash
npm start
```

Open http://localhost:3000 — you should see the Demo Pipeline dashboard.

## 4. Add the three new columns to your Airtable base (required for new features)

This version adds a **Staff number** field and a **Rescheduled** status with its
own **Rescheduled date** / **Rescheduled time** fields. Airtable needs matching
columns before these will save:

1. In your Airtable "Demos" table, add three columns:
   - `Staff Number` — Number field
   - `Rescheduled Date` — Date field
   - `Rescheduled Time` — Single line text field
2. For each new column, open the field menu ("...") and choose **Copy field ID**
   (or find it on the base's API docs page).
3. Open `lib/airtableClient.js` and replace the three placeholder values
   (`fldSTAFFNUMBERPLACEHOLDER`, `fldRESCHEDDATEPLACEHOLDER`, `fldRESCHEDTIMEPLACEHOLDER`)
   with the real field IDs you copied.

Until you do this, the Staff number / Rescheduled date / Rescheduled time
inputs will show in the app but **won't be saved** — everything else keeps
working normally.

## 5. Let your team use it (not just your laptop)

Running `npm start` only serves the app from your own machine. For sales and
IT teammates to reach it from their own computers, host it somewhere always-on:

- **Quickest, free option:** deploy to [Render](https://render.com) or
  [Railway](https://railway.app) — both support "New Web Service from a
  GitHub repo," auto-detect Node projects, and let you set `AIRTABLE_TOKEN`
  and `AIRTABLE_BASE_ID` as encrypted environment variables in their
  dashboard (never in your code).
- Once deployed, share the resulting URL (e.g. `https://demo-pipeline.onrender.com`)
  with your team — no Claude account, no Airtable account, no login needed
  for them to use it.

## Project structure

```
demo-pipeline-app/
├── server.js              Express server entry point
├── routes/demos.js        API endpoints (/api/demos)
├── lib/airtableClient.js  All Airtable API calls + field ID mapping
├── public/                Frontend (plain HTML/CSS/JS)
│   ├── index.html
│   ├── style.css
│   └── app.js
├── .env.example           Template for credentials (copy to .env)
└── package.json
```

## API endpoints

| Method | Path              | Purpose                     |
|--------|-------------------|------------------------------|
| GET    | /api/demos        | List all demo records        |
| POST   | /api/demos        | Create a new demo             |
| PATCH  | /api/demos/:id    | Update an existing demo       |
| DELETE | /api/demos/:id    | Delete a demo                 |
| GET    | /api/health       | Check server + config status  |
