# Second Brain

A private, offline-first second brain: article-style notes, a neural graph, a colony layout and a 3D sphere,
`[[wikilinks]]` with backlinks, tags, spheres, a writing dashboard, an optional Claude assistant, automatic
backups and optional sync between devices. One static web app, no build step, no server of your own.

Everything is saved on your device first (browser storage), so it works with no connection.

## Install it on your phone and computer (GitHub Pages, free)

1. Create a new repository on GitHub and push this folder to it (see below).
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. The *Deploy to GitHub Pages* workflow runs on every push to `main`. When it finishes, your app is at
   `https://<your-username>.github.io/<repo-name>/`.
4. Open that address and install it:
   - **Android (Chrome):** menu → *Install app*.
   - **iPhone / iPad (Safari):** Share → *Add to Home Screen*.
   - **Windows / Mac / Linux (Chrome or Edge):** the install icon in the address bar.

```bash
git init -b main            # skip if this folder is already a git repo
git add . && git commit -m "Second Brain"
git remote add origin git@github.com:<you>/<repo>.git
git push -u origin main
```

The data lives in each browser or installed app. Installing on a second device starts empty until you turn on
sync (below) or import a backup file.

## Settings (press `,` or use ⋯ → Settings)

- **Claude:** paste an Anthropic API key to use the assistant. It is stored on the device and requests go straight
  from the device to Anthropic. Use a key with a spending limit.
- **Sync · Firebase:** keeps your devices in step.
  1. Create a project at <https://console.firebase.google.com>.
  2. *Authentication* → turn on **Email/Password**.
  3. *Firestore Database* → create a database.
  4. *Firestore → Rules*: paste the rules shown in the app's Settings and publish.
  5. *Project settings → General*: copy the **Web API key** and **Project ID** into Settings, add an email and
     a password, then press **Connect** (or **Create account** the first time).
  Notes and images are stored in Firestore under your own user. Other devices update within ~15 seconds or when
  you return to the app. Edits made offline are kept and sent when you are back online.
- **Backups:** automatic snapshots on the device (only when something changed), restore, and a downloadable `.json`
  file that includes your images. Download one now and then and keep it somewhere else.
- **Performance:** the graph only simulates what is on screen once a map gets large.

## Keyboard and touch

Press `?` in the app for the full list. On a phone: bottom bar, long-press a note for actions, double-tap empty
space to zoom, swipe from the left edge to go back, swipe a note sideways for the next one.

## Run locally

```bash
npm start            # serves ./public at http://localhost:5173
npm install && npm test
```

The service worker only registers over `https://` or `http://localhost`.

## Updating

Edit `public/index.html`, bump `VERSION` in `public/sw.js` (for example `sb-v2`) so installed copies refresh,
and push. Your notes are not touched by updates.

## Native app wrappers (optional)

The PWA is enough for most uses. If you want a store-style app later, point a wrapper at `public/`:

- **Desktop (Tauri):** `npm create tauri-app@latest`, set `frontendDist` to `../public`.
- **Mobile (Capacitor):** `npm i @capacitor/core @capacitor/cli && npx cap init && npx cap add android ios`
  with `webDir: "public"`.

## Known limits

- Fonts load from Google Fonts when online; offline they fall back to your system fonts. Download the two font
  files into `public/` and edit the `<link>` if you want them fully offline.
- The API keys are kept in the browser's storage. Anyone with access to your unlocked device can read them.
- Firebase sync polls rather than streaming, and the last edit to a note wins if two devices change it at once.

## Layout

```
public/            the app (index.html), manifest, service worker, icons
tests/             headless tests (jsdom), run with npm test
.github/workflows  deploys public/ to GitHub Pages
```
