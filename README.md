# sdadhich04.github.io

Source for [sdadhich04.github.io](https://sdadhich04.github.io), the portfolio of Sparsh Dadhich: embedded ML for medical sensing.

Static site built with [Eleventy](https://www.11ty.dev/) and deployed to GitHub Pages by GitHub Actions. No client-side framework; the only script is the mobile menu toggle.

```sh
npm ci
npm run serve        # local preview at http://localhost:8080
npm run build        # writes _site/
npm run check:links  # fails on broken internal links
```

Every push to `main` builds the site, checks internal links, runs Lighthouse CI (performance ≥ 0.90, accessibility ≥ 0.95, mobile and desktop) and deploys.

Page text, data and media are © Sparsh Dadhich.
