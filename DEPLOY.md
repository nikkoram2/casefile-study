# Deploying (nothing has been deployed yet)

The build output `dist/` is a plain static site with relative paths. It needs no backend.

## Fastest: Netlify Drop (about 1 minute)
1. Go to https://app.netlify.com/drop and drag the `dist` folder (or `casefile-dist.zip` unzipped) onto the page.
2. Netlify gives you a public URL. Share it.

## GitHub Pages
1. Create a repo, run `npm install && npm run build`, and commit the contents of `dist/` to a branch (e.g. `gh-pages`), or commit the whole project and use a Pages workflow that runs `npm ci && npm run build` and publishes `dist/`.
2. Settings → Pages → select that branch/folder. URL: `https://<user>.github.io/<repo>/`.

## Verify the public link (do this before sharing)
- Open it in a private/incognito window on a Windows or Mac laptop. Menu should appear with no errors.
- Start Full Investigation, move, press E at Ward, answer the case-board question, then reload: **Continue Session** should be enabled.
- Open DevTools → Console: no red errors. Try Settings → text size and fullscreen.
- Progress is stored per browser (localStorage); a different browser or private window starts fresh.
