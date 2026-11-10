---
name: clone-website
description: Rebuild existing web pages as working local code, matching their real content, assets, responsive layout, and interactions. Use for website cloning, replication, or reverse engineering, including Framer sites and animated pages. In this project a cloned wedding invitation is always turned into a card template and added to the demo (/demo/<id>).
---

# Clone a website

Recreate the supplied pages in the current app. Match the source before adding a new design direction. Deliver working, editable code: screenshots, iframes, and downloaded production bundles are references, not the implementation.

## 1. Map the work

Read project instructions, the actual framework/scripts, and existing routes. Open the source URLs with the available browser. Prefer direct HTTP, asset tools, or APIs for extraction when practical; use the browser to establish appearance and behavior.

Record a short source-to-local route map and the files each page owns. Follow the app's conventions; **in this wedding-card project a cloned page always becomes a card template wired into the demo — follow [Add the clone to the demo](#add-the-clone-to-the-demo) instead of creating new routes or folders**. Give origins, pages, and downloads distinct names; add a port or URL hash when readable names collide.

- A first root clone may replace the untouched template homepage.
- Preserve source pathnames for multiple pages from one origin. Query/fragment variations usually represent states of the same route; reproduce those states.
- Preserve existing authored routes/assets. Update them when requested; resolve unrequested route collisions before replacing anything.
- When adding pages to an existing clone, extend its layout and global styles without replacing the styles used by existing pages.
- Use separate apps for different origins unless the user wants a combined app. Combined sites need distinct route prefixes and scoped fonts, styles, and layout.
- Escape literal URL segments that conflict with framework syntax (`_`, `@`, brackets, parentheses) using its supported mechanism, then verify the actual requested URL.

Existing clones are useful starting points: compare them with the current source and record what was reused. Finish when every requested URL has a destination and file ownership is clear.

## 2. Observe before building

Inspect the whole page at desktop and mobile widths. Scroll top to bottom to load lazy media and reveal sticky/pinned scenes. Then exercise menus, tabs, accordions, carousels, hover states, and primary links. Distinguish changes driven by **scroll, click, hover, or time**; a click imitation of a scroll-driven section is a different product.

Treat each observation as one sample of a **rule**. Read declared values (computed styles, CSS variables, a library's live options) rather than inferring them from one rendering, and vary viewport width (including wider than the design), viewport height, input, and state until you know what drives each change. Drive the page with the inputs visitors use (wheel, touch, keyboard, pointer); scripted scrolling bypasses behavior attached to them, such as smooth scrolling.

Save source screenshots labeled with viewport, scroll position, and interaction state. Capture alternate-state content/assets. Keep one compact page brief: section order, typography, layout measurements, asset mapping, and interactions. Add section briefs only when they help independent builders.

Read [the inspection reference](references/inspection-guide.md) for extraction and state comparison. For **Framer-generated pages, sticky scenes, reveal animations, or animated media**, read [Framer and motion](references/framer-and-motion.md).

Use the source's real text and the files it actually loads: fonts, images, SVGs, and video. A same-named substitute from another provider or icon set has different metrics or shapes. Measure important geometry/computed styles. Inspect layered images and media elements before rebuilding a visual as HTML. Track source URL → local asset path and verify content type/dimensions: a `.png` URL may return AVIF.

Finish when every section and meaningful state has enough evidence to build, with unavailable details identified. A large DOM dump does not replace looking at the page.

## 3. Build a complete first pass

Establish fonts, page width, colors, assets, routes, page-wide behavior, and shared components first. Build each shared component with every observed state (hover, focus, breakpoints) so builders reuse it as-is. Reuse fitting components. Prefer CSS for layout/simple motion and an animation library when source behavior needs it.

Build coherent sections with real content. Delegate independent pages/sections after shared files have an owner. Give builders screenshots, relevant measurements/state notes, asset paths, destination files, and a concrete finish line. A concise brief with precise file references is enough; no fixed agent count or per-component paperwork is required.

Recreate in-scope interactions. Preserve real outbound destinations. Rewrite links to local routes when those routes are included; leave out-of-scope destinations pointing to the source and disclose them. Visible controls must perform the behavior they promise.

Run the appropriate project check after an integrated slice. Finish this pass when every requested section/route renders with actual assets and important controls work.

## 4. Compare, repair, repeat

Open source/local pages at the **same viewport, scroll position, and state**. Let fonts, media, and reveal animations settle. Review the whole page wherever step 2 found a rule changing, plus a viewport wider than the design; judge scroll and pointer behavior with real input. A side-by-side montage locates drift; full-size sections establish detail.

Fix the largest visible differences first: geometry, missing sections/layers, typography/wrapping, asset crop, then spacing and motion. Recheck affected views. Compare animated regions in initial, active, and settled states, including reverse scroll when relevant.

Exercise the real local workflow: navigation between cloned routes, mobile menu, tab/accordion states, carousel boundaries, primary actions, media controls, and observed scroll-linked transitions. Check runtime errors, missing assets, and horizontal overflow. When adding pages, verify existing routes still work. Use a few browser checks at these boundaries rather than assertions about class names.

Run the project's production check. Completion requires a successful build **and** rendered comparison. State remaining differences precisely instead of calling an unchecked result pixel-perfect.

## Add the clone to the demo

In this project (thiep-cuoi-online) every clone of a wedding invitation ends up as a selectable card template, without the user asking. Do all of this as part of the clone, not as a follow-up:

1. **Template file** — `templates/<id>.js`, `<id>` a short lowercase Vietnamese slug (no accents, e.g. `nhungdo`) that doesn't collide with an existing file. Start from `templates/coban.js` and keep its shape: `id`, `name` (Vietnamese display name), `group` (one of the ids in `groups` in `lib/render.js`), `desc`, `fonts` (Google Fonts URL the source uses, or `''`), `palettes` (the source's colors as the first palette; each palette sets the CSS variables `--page --bg --paper --ink --muted --accent --accent-ink --gold --line --font-title --font-script --font-body`), `opener(ctx)` (must contain `#opener` and a `#openBtn` button), `cover(ctx)`, `css` scoped under `.tpl-<id>`, and optionally `title(text, sub)`, `layout` and `sections`.
2. **Real content goes through card data, not hardcoded text.** Map the source's names, date, events, story, photos, RSVP, gift and wishes onto the shared sections (`invite, calendar, events, story, gallery, rsvp, gift, wishes, thanks` in `lib/render.js`) via `ctx` (`ctx.g`, `ctx.b`, `ctx.d`, `ctx.dateBlock()`, `ctx.lunar`…). Reorder with `layout`; override one section's look with `sections.<name>(ctx, opts, helpers)` only when the shared one can't be styled to match. Ornaments: reuse `templates/_orn.js` before drawing new SVG.
3. **Assets** — save the source's decorative images and the couple photos it shows to `public/demo/<id>-<n>.<ext>` (names must match `[\w.-]+`). Decorative images are referenced directly from the template; the couple's photos go in `demo: { cover: '/demo/<id>-1.jpg', photos: ['/demo/<id>-2.jpg', …] }` on the template so `/demo/<id>` shows them while real cards still use the user's own photos.
4. **Register** — add `<id>: require('../templates/<id>')` to `templates` in `lib/render.js`. It then appears automatically in the editor, the home-page gallery and `/api/meta`.
5. **Docs** — add the template to the "Mẫu thiệp" section of `README.md` (name + `id`).
6. **Check** — run `node test/smoke.js` (it renders every template × palette and requires `#openBtn`), then open `/demo/<id>` with `node server.js` and compare it with the source per step 4 above, at mobile width first (cards are viewed on phones).

Don't commit unless the user asks.

## Deliver

Return preview/run instructions (`/demo/<id>` and `/demo/<id>?palette=<palette id>`), the source-to-local mapping, representative desktop/mobile comparisons, checks actually run, and remaining visual/functional gaps.
