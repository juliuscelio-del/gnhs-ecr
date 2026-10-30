# GNHS ECR – React layer

Your original `ElectronicClassRecordFINAL.html` stays exactly as it is. This folder adds a
small React layer on top and builds **one offline HTML file** (no internet needed, same as today).

Put this folder in the repo root, next to `ElectronicClassRecordFINAL.html`:

```
gnhs-ecr/
├─ ElectronicClassRecordFINAL.html     ← untouched original (still works on its own)
├─ react-shell/                        ← this folder
│  ├─ src/            React code (LoginScreen, RosterPanel, bridge to the old code)
│  ├─ test/           unit tests + browser test
│  └─ build.mjs       builds dist/ElectronicClassRecordFINAL.html
```

## Build

```
cd react-shell
npm install          # first time only; commit the generated package-lock.json
npm run build        # → dist/ElectronicClassRecordFINAL.html  (open it by double-click, works offline)
npm test             # unit tests for the roster logic
npm run test:e2e     # real-browser test of the built file (needs: npx playwright install chromium)
```

## What is React now

| Piece | What it does | Safety net |
|---|---|---|
| **Login** (`LoginScreen.jsx`) | Same accounts, rules and wording as before; saves in the same IndexedDB keys; finishes through the original `_completeLogin()` so the toolbar badge, session, "welcome back" device memory and the Teacher Profile popup behave the same. | If React fails to start, the original login overlay is still there and works. |
| **Roster** (`RosterPanel.jsx`) | Replaces the 👥 Roster popup: section list with counts, 30-row boys/girls editors, *Paste list*, per-row clear, duplicate highlight, unsaved-changes guard, CSV import/export (byte-identical to the old export). Reads/writes the same `ecr_classlist` record. | The old popup is kept and comes back automatically if React errors. |

Rows are **positional** (row 5 is the same learner in every sheet), so there is deliberately no
"delete row" or "sort": clear the row and leave it blank, as the old popup also required.

## How to move more screens to React later

1. Put new code in `src/`, read/write data only through `src/bridge.js`.
2. Take over the old screen the way `RosterPanel` does (replace the `window.openXxx` function it opens from).
3. Keep storage keys unchanged so existing teachers' data keeps loading.

## Add to GitHub Actions (optional)

I could not see your current workflow, so nothing was changed. Where it currently uses the root HTML, add:

```yaml
- uses: actions/setup-node@v4
  with: { node-version: 22 }
- run: npm ci && npm run build
  working-directory: react-shell
# use react-shell/dist/ElectronicClassRecordFINAL.html instead of the root file
```
