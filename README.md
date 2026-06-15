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

## Updating Session Data

For now, class/session records live in `src/data/sessions.json`.

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

When the source data is ready, this local JSON can be replaced with Airtable, Google Sheets, Supabase, or a Netlify function.
