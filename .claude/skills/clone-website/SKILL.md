---
name: clone-website
description: Clone a wedding invitation page from another site into this project as a card template (templates/<id>.js), wired into the demo at /demo/<id>, matching the source's real assets, layout at phone/tablet/desktop widths, and interactions. Use when the user gives a URL of an invitation/theme to clone, replicate or "làm giống".
---

# Clone a wedding invitation into a card template

Output is always **one card template** in this project (thiep-cuoi-online), not new routes or folders: `templates/<id>.js` + images in `public/demo/<id>-*` + one line in `lib/render.js` + README. Everything the couple types (names, parents, date, events, photos, RSVP, gift, wishes, message) comes from card data, so the template must render any card, not just the demo.

Match the source before adding ideas of your own. Screenshots and downloaded bundles are references, not the implementation. Don't commit unless the user asks.

Scripts in `scripts/` run in the browser with the browser tool's JavaScript action (paste the file, then call the function it defines):

| File | Use |
|---|---|
| `dump-classes.js` | `__dumpClasses(rootEl)` — the source's DOM as `tag[classes] text` lines, deduplicated. Tailwind classes (incl. `md:`/`sm:`) give exact sizes per breakpoint. |
| `audit.js` | `__audit(spec)` — boxes (relative to a reference element), fonts, colors, backgrounds, borders, shadows of named elements. Same spec shape on source and clone, so numbers line up. |
| `prep-clone.js` | `await __prepClone()` — opens the local card, turns off reveal animations and smooth scroll so measurements are final. |

## 1. Inspect the source

1. **Open it at 375 px** (preset mobile) in the browser, then at 768 and 1280. The browser pane resets the emulated size whenever the pane resizes: re-apply it and check `innerWidth` before every measurement.
2. **Read the classes first.** Run `__dumpClasses` on the card's column (the element with `max-w-[480px]`-style classes) before and after opening the card. Tailwind units: `1` = 4 px (`pt-28` = 112 px), `text-[15px]`, `md:` applies from 768 px, `sm:` from 640, `lg:` from 1024. Inline `style` attributes and `<style>` tags (keyframes, `.something{}` rules) hold the rest — read them for animations.
3. **Read computed styles where classes don't say it:** colors (often `color-mix`/rgba), font families actually used (`getComputedStyle(el).fontFamily`), overlay layers (`absolute inset-0` images with `opacity`/`mix-blend-mode`), `box-shadow`, `overflow-x: clip` vs `hidden` (decor that spills into the next section).
4. **Press every control** — open button, RSVP, gift box, album arrows/dots, map link — and record what happens. Invitation sites often open **dialogs** (RSVP form, gift QR sheet); reproduce them as `<dialog>` in the template, not as sections.
5. **Assets:** take image URLs from `currentSrc`, download them into `public/demo/<id>-<name>.<ext>`, then **check the bytes with `file`** — CDNs serve JPEG under `.webp` names (rename to the real extension) and HTML error pages with HTTP 200 (delete). Shrink large photos (`sips -Z 1400`). Names must match `[\w.-]+`.
6. **Fonts:** Google-hosted families go in the template's `fonts` URL. If the source uses a system font (e.g. `Baskerville`, `Times New Roman`), put it **first** in the stack and a Google look-alike after it.
7. **Text matching in scripts:** Vietnamese text in the DOM may be decomposed; compare with `.normalize('NFC')`, and skip invisible duplicates (`getBoundingClientRect().height > 0`).

## 2. Map source sections onto card sections

Write a short table before building — source section → template part → card fields:

| Template part | Card data (`ctx`) |
|---|---|
| `opener(ctx)` | `ctx.g`, `ctx.b`, `ctx.dparts`, `ctx.guest` — must contain `#opener` and `#openBtn` |
| `cover(ctx)` | `ctx.d.cover` / `ctx.d.photos[0]`, names |
| `sections.invite` | parents (`d.groom.father/mother/address`, same for bride), full names, ceremony event, date, `ctx.lunar` |
| `sections.calendar` | party event, `h.calGrid(ctx, head)`, `h.calendarLink(...)` |
| `sections.events` | `d.events` (skip empty ones) → venue/map + timeline |
| `sections.gallery` | `d.photos`; keep `.ph[data-i]` buttons (card.js opens the lightbox) |
| `rsvp` | `h.rsvp(ctx)` — keeps `#rsvpForm`; can live inside a `<dialog>` |
| `sections.wishes` | `#wishForm` with `name`/`message` fields, `.form-msg`, `#wishList` (card.js posts and prepends `.wish`) |
| `sections.gift` | `h.giftCard(ctx, d.gifts.groom|bride, who)` |
| `sections.thanks` | `d.message` |

Override a shared section only when styling can't match; reorder with `layout`; shared sections live in `lib/render.js`. List source parts with **no card data** (e.g. dress code) as known gaps instead of hard-coding them. Set the template's `demo: {…}` (photos, `story`, `events`, …) so `/demo/<id>` shows the **same content as the source** — comparison is meaningless otherwise.

## 3. Build

- `templates/<id>.js`, `<id>` a short accent-free slug not already used. Start from `templates/dodam.js` and keep its shape: `id, name, group` (an id from `groups` in `lib/render.js`), `desc, fonts, palettes` (first palette = source colors; each sets `--page --bg --paper --ink --muted --accent --accent-ink --gold --line --font-title --font-script --font-body`), `demo, layout, title, opener, cover, sections, css`.
- All CSS scoped under `.tpl-<id>`. Phone values first, then `@media (min-width:640px)`, `(min-width:768px)`, `(min-width:1024px)` blocks mirroring the source's `sm:`/`md:`/`lg:` classes.
- Copy recipes literally (transforms, keyframes, percentages) rather than re-inventing them.
- Register `<id>: require('../templates/<id>')` in `templates` in `lib/render.js`; add the template to the "Mẫu thiệp" table in `README.md`.
- Run `node test/smoke.js` (renders every template × palette, requires `#openBtn`).

## 4. Verification gate (required before saying it matches)

Start the app (`.claude/launch.json` → preview `thiep`), open `/demo/<id>` next to the source.

For **every section** — opener, cover, each panel, album, map, timeline, guestbook, gift, footer, and each dialog — at **375, 768 and 1280 px**:

1. On the clone run `await __prepClone()`; on the source click the open button and wait for its animation.
2. Run `__audit` with the same spec on both (anchor each section on its own top so earlier height differences don't shift everything). Compare boxes, fonts, colors, shadows, overlays.
3. `zoom` into the section on both sides (not a downscaled page shot) for texture, layering and ornament placement.
4. Write the **diff table**: section × width × property, source vs clone. Fix every row, or mark it as a data difference / known gap with the reason.
5. Re-check fixed sections and their neighbours (ornaments overlap the next section), `document.documentElement.scrollWidth === innerWidth` at every width, console errors, and every control from step 1.4.

Never write "matches the source" for widths, sections or states you did not check; say which were checked.

## 5. Deliver

Report: `/demo/<id>` (and `?palette=<id>`), the section mapping, the diff table result per width, checks run (smoke test, controls, overflow), and remaining gaps (data the card model lacks, intentional changes). Remind the user that the template uses the source's own images and should only be shown publicly with their own artwork.

For pages built with Framer or heavy scroll animation, also read [Framer and motion](references/framer-and-motion.md); for general extraction tips, [the inspection reference](references/inspection-guide.md).
