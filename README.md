# mrt-arch.com

Portfolio website of **Marta Maçães Viana**, architect. Live at <https://mrt-arch.com>.

Built with [Eleventy](https://www.11ty.dev/), plain CSS and a little plain JavaScript.
No CSS framework. GitHub Actions builds the site and publishes it to GitHub Pages
on every push to `main`.

## Preview on your computer

With Docker (nothing else to install):

```sh
docker compose up                 # then open http://localhost:8080
docker compose run --rm shots     # screenshots of every page → screenshots/
```

With Node 22 or newer:

```sh
npm install
npm start                         # http://localhost:8080, reloads on save
npm run check                     # valid HTML, no broken links
npm test                          # automatic tests (behaviour, accessibility, layout)
npm run shots                     # screenshots of every page → screenshots/
```

The first build encodes all photos and takes about a minute. Later builds reuse
the result and take less than a second.

## Where things are

```
src/
  _data/site.yml          name, email, social links, home page text, menu
  _data/cv.yml            the CV on the About page
  _data/i18n.yml          all interface text (buttons, labels)
  _data/redirects.yml     old URLs that forward to new ones
  about.md                the About text
  portfolio/<project>/    one folder per project: index.md + its photos
  assets/css/main.css     all styles
  assets/js/              menu, home slideshow, image viewer, contact form
  assets/img/             logo, icons, link-preview image
  _includes/              page layouts
scripts/                  screenshot and check scripts
design/logo/              original logo files (not published)
```

## Add a project

1. Make a folder `src/portfolio/<short-name>/`, for example `src/portfolio/river-house/`.
   The folder name becomes the URL: `mrt-arch.com/portfolio/river-house/`.
2. Put the photos in that folder (JPEG, PNG or WebP; full resolution is fine).
3. Copy `index.md` from another project into the folder and change the text.
   The fields are described in [CLAUDE.md](CLAUDE.md#project-fields).
4. Run `npm run shots -- --only=river-house` and look at the screenshots.

## Photos

The build makes AVIF and JPEG copies of each photo in several widths, so a phone
downloads a small file and a 4K screen gets a sharp one. The originals stay in
the repository and are not published. Photos in a project folder that no page
uses are not published either.
