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
- `STRIPE_MONTHLY_PRICE_ID`
- `STRIPE_ANNUAL_PRICE_ID`

After a successful checkout, Stripe returns members to `/profile`, where payment is verified before the profile form unlocks the calendar.

## Supabase Auth

Member passwords and login sessions are handled by Supabase Auth.

The site is connected to:

- `VITE_SUPABASE_URL=https://zpgvztndfkochixhuvaf.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_IAjh2tVf_Ejkyh4HYh4KwA_BuQ-KnR1`

Those values are safe to expose in the browser, but you can also add them in Netlify as environment variables.

The Supabase table `public.member_profiles` stores profile fields. Row Level Security is enabled so each authenticated member can only read and edit their own profile.

If Supabase email confirmation is enabled, new users may need to confirm their email before their first login. For launch testing, you can disable email confirmation in Supabase Auth provider settings.

## Airtable Members

Airtable still acts as the admin-editable paid member list and profile mirror through `/api/member`.

Create a table named `Members`, or set:

- `AIRTABLE_MEMBERS_TABLE_ID`

Recommended member fields:

- `Email`
- `Paid`
- `Membership Type`
- `Profile Complete`
- `Name`
- `Pronouns`
- `Birthday`
- `Instagram`
- `Neighborhood`
- `Heard About Us`
- `Interests`
- `Experience Level`
- `Bio`
- `Stripe Customer ID`
- `Stripe Subscription ID`

To manually add a member, create a record with `Email` and check `Paid`. Then the member can use `/create-account` to create their secure Supabase password.

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
