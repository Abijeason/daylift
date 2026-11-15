# Setup

You'll need Node.js 22 or newer.

```bash
npm install
npm run dev
```

Vite prints a local address, which ends in `/daylift/`.

| Command | What it does |
|---|---|
| `npm run dev` | Runs the app for development |
| `npm test` | Runs all tests |
| `npm run build` | Checks types and builds to `dist/` |
| `npm run preview` | Serves the production build |
| `node scripts/check-videos.mjs` | Checks form video links and updates the review list |

Offline mode only works in the production build.

## Deploying

The site is hosted free on GitHub Pages at `https://<username>.github.io/daylift/`. The repository must be public and named `daylift`, because the build expects that path (`base` in `vite.config.ts`).

1. Push to `main` on GitHub.
2. In the repository, go to **Settings → Pages** and set **Source** to **GitHub Actions**. This is needed once.
3. `.github/workflows/deploy.yml` then runs the tests, builds the app and publishes `dist/` on every push to `main`. Progress shows in the **Actions** tab.

A failing test stops the deploy, so a broken build never goes live.
