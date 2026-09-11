# Making product/setting changes persist (Supabase + Cloudinary)

Your Admin page was only updating in-memory React state, so a refresh
reset everything back to the sample catalog. This has now been wired
up to Supabase (database) + Cloudinary (image hosting). Follow these
steps once to finish the connection.

## 1. Run the database setup

1. Open your Supabase project -> **SQL Editor** -> **New query**.
2. Open `supabase-schema.sql` (in this project folder), copy the whole
   thing, paste it in, and click **Run**.
3. This creates a `products` table (seeded with your current 16
   products) and a `settings` table, with public read/write policies
   so your site can use them with just the anon key.

> Re-running this file is safe for the table/policy parts, but the
> `insert into products ...` seed block will duplicate rows if you run
> it a second time. Delete that block before re-running if needed.

## 2. Create your `.env` file

Copy `.env.example` to a new file named `.env` in the project root, and
fill in the 4 values:

```
VITE_SUPABASE_URL=...        # Supabase -> Project Settings -> API -> Project URL
VITE_SUPABASE_ANON_KEY=...   # Supabase -> Project Settings -> API -> anon public key
VITE_CLOUDINARY_CLOUD_NAME=...      # Cloudinary dashboard home
VITE_CLOUDINARY_UPLOAD_PRESET=...   # Cloudinary -> Settings -> Upload -> Upload presets (create one, Signing Mode: Unsigned)
```

## 3. Install the new dependency

```
npm install
```

(This pulls in `@supabase/supabase-js`, added to `package.json`.)

## 4. Test locally

```
npm run dev
```

Go to `/admin`, add/edit/delete a product, then refresh the page — it
should now still be there. Same for the site settings section.

## 5. Add the same env vars to Vercel

Vercel doesn't read your local `.env` file — you need to add the same
4 variables there too:

Vercel dashboard -> your project -> **Settings** -> **Environment
Variables** -> add all 4 -> redeploy (or push a new commit).

## What changed in the code

- `src/lib/supabaseClient.js` — new, creates the Supabase client
- `src/lib/cloudinary.js` — new, uploads a file to Cloudinary and
  returns its hosted URL
- `src/App.jsx` — now fetches products + settings from Supabase on
  load instead of starting from the hardcoded catalog
- `src/pages/Admin.jsx` — add/edit/delete now write to Supabase
  (with the UI updating instantly, then syncing); image upload now
  goes to Cloudinary instead of being embedded as base64
- `supabase-schema.sql` — run once to create your tables
- `.env.example` — template for your credentials
- `.gitignore` — keeps `.env` and `node_modules` out of git

## Note on security

`/admin` is now behind a password screen (`src/components/AdminGate.jsx`,
password is `0000` — change the `ADMIN_PASSWORD` constant in that file
to update it, or restore it by clearing the browser's sessionStorage
key `scentfused-admin-auth`).

Be aware this is a **front-end-only** gate: it stops casual visitors
from seeing/using the admin form, but it does not stop someone
technical from calling the Supabase API directly with the public anon
key (which is visible in your deployed JS bundle either way) and
adding/editing/deleting products, because the RLS policies in
`supabase-schema.sql` still allow public insert/update/delete. For
real protection against that, add Supabase Auth and restrict those
policies to logged-in admins only — ask me when you're ready and I'll
wire that in.
