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

Optional overrides are already defaulted to the current base/table:

- `AIRTABLE_BASE_ID=appQxIhwr00DmKBx5`
- `AIRTABLE_TABLE_ID=tblGTqTTdAlPPVXm0`

Only set `AIRTABLE_VIEW_ID` if you intentionally want the site limited to one Airtable view.

## Stripe Membership

The signup page starts Stripe Checkout through `/api/create-checkout-session`.

Set these Netlify environment variables:

- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID`

After a successful checkout, Stripe returns members to `/profile`, where payment is verified before the profile form unlocks the calendar.

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

When the source data is ready, this local JSON can be replaced with Airtable, Google Sheets, Supabase, or a Netlify function.
