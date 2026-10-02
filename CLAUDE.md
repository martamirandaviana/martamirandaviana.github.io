# Instructions for coding agents

This repository is the portfolio website of Marta Maçães Viana, an architect.
Marta edits it, often through a coding agent. She is not a developer, so explain
changes in plain words and show her the result before you publish anything.

## Golden rule: show renders before you publish

Every push to `main` goes live on https://mrt-arch.com within a few minutes.
Before you commit and push a change:

1. Run `npm run check`. It must pass (valid HTML, no broken links).
2. Run `npm test`. All tests must pass (see "Tests" below).
3. Run `npm run shots` (or `npm run shots -- --only=<part-of-url>` for one page).
   It writes PNG files to `screenshots/phone/`, `screenshots/laptop/` and
   `screenshots/desktop/`.
4. Look at the screenshots yourself. Then send Marta the relevant ones (at least
   phone and laptop for each changed page) and wait for her approval.
5. Only then commit and push.

If Playwright has no browser yet: `npx playwright install --with-deps chromium-headless-shell`.
If you cannot run a browser at all, push to a branch and open a pull request instead
of pushing to `main`. The "Preview" workflow then attaches screenshots to the run.

## Commands

| Command | What it does |
|---|---|
| `npm install` | Install dependencies (once). |
| `npm start` | Local server at http://localhost:8080 with live reload. |
| `npm run build` | Build the site into `_site/`. |
| `npm run check` | Build, validate HTML, check internal links and images. |
| `npm test` | Build and run the automatic tests at phone, laptop and desktop size (about 20 s). `npm run test:ui` opens them in a window. |
| `npm run shots` | Build and make full-page screenshots of every page. Options: `--only=<text>`, `--sizes=phone,laptop,desktop`, `--fold` (first screen only), `--no-build`. |

The first build encodes all photos (about a minute). Later builds take under a second.

## Tests

The tests are in `tests/` (Playwright). They run in a real browser at three
screen sizes: phone (390 px, 2× pixels), laptop (1440 px) and desktop (2560 px).

### How to run them

```sh
npm install                                              # once
npx playwright install --with-deps chromium-headless-shell   # once: the test browser
npm test                                                 # all tests, all sizes (~20 s)
npm test -- tests/hero.spec.js                           # one file
npm test -- --project=phone                              # one size: phone, laptop or desktop
npm test -- -g "lightbox"                                # tests whose name contains "lightbox"
npm run test:ui                                          # interactive window (on a computer with a screen)
docker compose run --rm test                             # same tests in Docker, no Node needed
```

`npm test` builds the site first, then serves `_site/` on port 4173.

### When a test fails

- The output names the test, the screen size and the expected and received values.
- `test-results/<test-name>/` has a screenshot, `error-context.md` (the page
  structure at the moment of failure) and a trace. Open a trace with
  `npx playwright show-trace test-results/<test-name>/trace.zip`.
- Run the one failing test again with `-g "<name>" --project=<size>` while you fix it.
- In a pull request, the "Preview" workflow attaches the report as `test-report`.

### Rules

- Do not change or delete a test to make it pass. Find out why it fails. If the
  site is correct and the test is wrong, say so to Marta and explain why.
- When you fix a bug, first add a test that fails because of the bug, then fix it.
- Test what the visitor sees. A correct CSS value is not proof (see the pixel
  test for the slideshow dots in `hero.spec.js`).
- A test must pass every time. Check a new test with `--repeat-each=5`.

| File | What it checks |
|---|---|
| `pages.spec.js` | Every page: loads with no errors, title/description/share image, one `h1`, no WCAG 2.2 AA problems (axe), no sideways scroll, every image has real alt text and is sharp on the screen, the Geograph font loads. |
| `layout.spec.js` | Design rules: logo lines up with the content, hero title fits its column, hero is in the first screen, text lines are not too long, card titles show without hover, footer at the bottom. |
| `hero.spec.js` | Home slideshow: plays on its own, keeps playing after a click, pause/play button, keyboard pause, reduced motion, the current dot is visibly marked (real pixels). |
| `navigation.spec.js` | Menu (phone and desktop), previous/next project, old URLs forward, 404 page, sitemap. |
| `lightbox.spec.js` | Image viewer: open, arrows, Escape, focus returns, large image loads. |
| `contact.spec.js` | Contact form with a fake Formspree: success, failure, incomplete form. No real message is sent. |
| `no-javascript.spec.js` | The site still works with JavaScript off. |

New projects are tested automatically: the tests read the project list from
`src/portfolio/`.

## Project fields

Each project is `src/portfolio/<slug>/index.md`, with its photos in the same folder.
The front matter fields:

```yaml
---
title: Sea House                         # required
subtitle: Renovation of a house          # short line under the title
description: One sentence for Google and link previews.
order: 2                                 # position in the portfolio (1 = first)
featured: true                           # show in the home page slideshow
year: 2024
location: Apúlia, Esposende, Portugal    # optional
type: Renovation                         # optional
award: Honorable Mention                 # optional
collaborators: Name One, Name Two        # optional
photography: Photographer Name           # optional
cover: P5_Capa1.jpg                      # square cover image (crop to 1:1 is best)
cover_alt: What the cover image shows.
gallery:                                 # photos in page order
  - src: P5_00.jpg
    alt: What the photo shows.           # required, one sentence
    caption: Optional text under the photo.
    size: full                           # optional: never pair this photo
---

Project text in Markdown. Use **bold** for emphasis (it shows as darker text).
```

Layout rules that the gallery applies automatically: landscape photos use the
full width; two portrait photos in sequence share one row. Do not add HTML for
the gallery; the layout makes it from the `gallery` list.

To hide a project without deleting it, add `published: false`.
To rename a project folder that is already live, add the old URL to
`src/_data/redirects.yml`.

## Other content

- About text: `src/about.md`. CV: `src/_data/cv.yml` (Markdown allowed in `text` and `note`).
- Email, social links, home page intro, menu: `src/_data/site.yml`.
- Button and label text: `src/_data/i18n.yml`.
- Contact form: posts to Formspree (`form_endpoint` in `site.yml`).

## Design rules

- Light theme only. Colours, type sizes and spacing are tokens at the top of
  `src/assets/css/main.css`; change the tokens, not individual rules.
- The only font is Geograph Regular. There is no bold weight on purpose
  (`font-synthesis: none`). Use size, spacing or capitals for hierarchy.
- No CSS or JS frameworks, no CDN files, no trackers. Keep JavaScript optional:
  every page must work without it.
- Every image needs a real `alt` text. Never use the file name as alt text.
- Do not publish private data (for example a phone number), not even in an HTML comment.

## Future: Portuguese version

All interface text is in `src/_data/i18n.yml` under `en:`. To add Portuguese,
add a `pt:` block, add translated pages under `src/pt/`, and set `lang` per
page. Eleventy's i18n plugin can then make the language switch links.
