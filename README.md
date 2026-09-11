# Scentfused — React

A Vite + React rebuild of the Scentfused storefront, with per-category pages and an Admin
panel for managing products and site settings.

## Run it

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually http://localhost:5173).

## Pages / routes

- `/` — home (hero, latest arrivals carousel, shop-by-category teaser)
- `/perfumes`, `/attars`, `/soaps`, `/candles` — one dedicated page per category
- `/admin` — admin panel

## Structure

```
src/
  data/catalog.js         product data (id, category, name, note, price, image)
  data/settings.js        default site settings + brand font options
  utils/color.js          derives hover/dim gold shades from one accent color
  components/             Nav, Hero, Carousel, CategorySection, ProductCard, Footer, Icon
  pages/Home.jsx           storefront home page
  pages/CategoryPage.jsx   one category's full product grid
  pages/Admin.jsx          admin panel
  App.jsx                  shared product + settings state, routes, applies theme as CSS vars
  App.css                  all styling
```

## Admin panel (`/admin`)

**Site settings**
- Brand font — pick from several preloaded Google Fonts for the "scentfused" wordmark, with a live preview
- Accent color — one color picker drives the gold accent everywhere (hover/dim shades are derived automatically)
- Show "New" badge on latest arrivals — toggle
- Auto-scroll the latest arrivals carousel — toggle

**Products**
- Add, edit, or delete products; table is filterable by category
- Each product can have an image — paste a URL, or upload a file (converted to a data URL, capped at 2MB so the in-memory state stays reasonable). Products without an image fall back to the category's line-art icon.

All of this lives in React state (`App.jsx`) and is shared with the storefront, so changes in
Admin immediately show up on Home and the category pages. There's no backend — refreshing the
page resets everything to the defaults in `data/catalog.js` / `data/settings.js`. To persist
changes, connect this state to an API or something like `localStorage`.

## Note on the brand font

The original brief asked for "Robot Monster" for the wordmark — that's a paid,
non-redistributable font, so it isn't in the list. The available options (Audiowide, Orbitron,
Bebas Neue, Cinzel, Metal Mania, Monoton) are free Google Fonts in a similar bold/display spirit.
If you have a license for Robot Monster, add its `@font-face` and font name to
`data/settings.js`'s `FONT_OPTIONS` and it'll show up in the picker.
