# Marta Maçães Viana — architecture portfolio

Portfolio website of **Marta Maçães Viana**, architect.
Website address: <https://mrt-arch.com>.

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
   The folder name becomes the URL: `<site>/portfolio/river-house/`.
2. Put the photos in that folder (JPEG, PNG or WebP; full resolution is fine).
3. Copy `index.md` from another project into the folder and change the text.
   The fields are described in [CLAUDE.md](CLAUDE.md#project-fields).
4. Run `npm run shots -- --only=river-house` and look at the screenshots.

## Custom domain

The custom domain is `mrt-arch.com`, registered with Amen. Its configuration is:

1. In [GitHub → Settings → Pages](https://github.com/martamirandaviana/martamirandaviana.github.io/settings/pages),
   set **Custom domain** to `mrt-arch.com` and save. Keep **GitHub Actions** as
   the publishing source.
2. In Amen's DNS editor, the saved records should have exactly these names
   and values. This editor can treat `@` as a literal subdomain and save it as
   `@.mrt-arch.com`; that does not configure the root domain. Correct those
   names to `mrt-arch.com` in the existing-record table.

   | Type | Name | Value |
   | --- | --- | --- |
   | A | mrt-arch.com | 185.199.108.153 |
   | A | mrt-arch.com | 185.199.109.153 |
   | A | mrt-arch.com | 185.199.110.153 |
   | A | mrt-arch.com | 185.199.111.153 |
   | CNAME | www.mrt-arch.com | martamirandaviana.github.io. |

   Replace existing conflicting website records for `mrt-arch.com` and `www`. Remove
   conflicting AAAA records that direct the website to another host. Leave
   email records (MX and email-related TXT records) unchanged. A TTL of 3600
   seconds, or Amen's default, is suitable.
3. Once GitHub's DNS check succeeds and its certificate is ready, enable
   **Enforce HTTPS**. DNS changes may take up to 24 hours to propagate.
4. Keep `url: https://mrt-arch.com` in
   `src/_data/site.yml`. It controls canonical URLs, link previews, structured
   data, robots.txt and the sitemap.

This repository deploys through GitHub Actions, so the custom domain must be
saved in the GitHub Pages settings; a repository `CNAME` file does not configure
the domain for this deployment method. With both DNS names configured, GitHub
Pages redirects `www.mrt-arch.com` to the selected root domain.

GitHub's instructions:
[Managing a custom domain for your GitHub Pages site](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).

## Photos

The build makes AVIF and JPEG copies of each photo in several widths, so a phone
downloads a small file and a 4K screen gets a sharp one. The originals stay in
the repository and are not published. Photos in a project folder that no page
uses are not published either.
