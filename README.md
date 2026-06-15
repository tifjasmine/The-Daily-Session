# The Daily Session

React/Vite site for migrating The Daily Session from Softr to GitHub and Netlify.

## Local Development

```bash
npm install
npm run dev
```

## Deploying To Netlify

Use these Netlify settings:

- Build command: `npm run build`
- Publish directory: `dist`

The same settings are also saved in `netlify.toml`.

## Airtable Data

The deployed site reads session data from the Netlify function at `/api/sessions`.

Set this required Netlify environment variable:

- `AIRTABLE_TOKEN`

Optional overrides are already defaulted to the current base/table/view:

- `AIRTABLE_BASE_ID=appQxIhwr00DmKBx5`
- `AIRTABLE_TABLE_ID=tblGTqTTdAlPPVXm0`
- `AIRTABLE_VIEW_ID=viwAMPxJ2RPAIR4oI`

## Updating Session Data

For local fallback, class/session records live in `src/data/sessions.json`.

Each record uses this shape:

```json
{
  "id": "sample-1",
  "title": "Morning Flow",
  "studio": "Neighborhood Studio",
  "start": "2026-06-15T09:00:00-04:00",
  "status": "Scheduled"
}
```

The app counts:

- remaining sessions today
- sessions tomorrow
- studios in network

When Airtable is configured in Netlify, the fallback JSON is replaced by the live Airtable records.
