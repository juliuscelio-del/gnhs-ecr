# GNHS ECR – React App

Clean multi-file React version of the Electronic Class Record (Grades 7–10).

This folder **replaces** the previous hybrid `react-shell`.  
The original `ElectronicClassRecordFINAL.html` in the repo root is still available as a fallback.

```
gnhs-ecr/
├─ ElectronicClassRecordFINAL.html   ← original single-file version (fallback)
├─ react-shell/                      ← this folder (new multi-file React app)
│  ├─ src/
│  │  ├─ components/     Header, SectionTabs, QuarterTabs, GradeSheet, modals
│  │  ├─ data/           default sections & constants
│  │  ├─ utils/          storage + grade calculations
│  │  └─ styles/
│  ├─ package.json
│  └─ vite.config.js
└─ .github/workflows/
```

## Features (mirrors ElectronicClassRecordFINAL.html)

| Feature | Status |
|---------|--------|
| Sections (Grade 7-10) | done (10 defaults; HTML also has 5 spare "New Section" slots - todo) |
| Boys / Girls roster editor | done |
| Subject tabs per section (Math, Science) | done |
| 3 terms (1st / 2nd / 3rd) | done |
| WW 1-5, PT 1-3, QA = ST1/ST2/TE | done |
| Total / PS / WS per component | done |
| Per-subject weights (English 30/50/20, TLE & MAPEH 20/60/20, ...) | done |
| DepEd transmutation table (Initial -> Final grade) | done |
| Descriptors (Advancing ... Emerging) | done |
| Highest-possible-score row + over-max rejection | done |
| Avg Grade & MPS tab | todo |
| Test Analysis tab | todo |
| Grading Scale tab | todo |
| Teacher login / change password | todo |
| PDF export / print layout | todo |
| JSON export, IndexedDB storage, MAPEH sub-components | todo |

`src/utils/grades.js` is verified against the HTML's own `calcGrades`, `transmute`
and `getDescriptor` (2,000 random score sets + every 0.01 step from 0-100: 0 mismatches).

## Development

```bash
cd react-shell
npm install
npm run dev
```

Open the URL shown in the terminal (usually http://localhost:5173).

## Build for production

```bash
cd react-shell
npm install
npm run build
```

Output goes to `react-shell/dist/`.  
You can serve the contents of `dist/` on any static host (GitHub Pages, Netlify, etc.).

## Project structure

```
src/
  App.jsx                 – main state & layout
  main.jsx                – entry point
  components/
    Header.jsx
    SectionTabs.jsx
    QuarterTabs.jsx
    GradeSheet.jsx        – main score entry table
    RosterModal.jsx
    ProfileModal.jsx
    WeightsModal.jsx
  data/
    sections.js           – default sections, score columns, weights
  utils/
    storage.js            – localStorage helpers
    grades.js             – percentage & quarterly grade logic
  styles/
    index.css
```

## How to extend

| Want to change…              | Edit this file                    |
|-----------------------------|-----------------------------------|
| Grade calculation rules     | `src/utils/grades.js`             |
| Default sections / columns  | `src/data/sections.js`            |
| How data is saved           | `src/utils/storage.js`            |
| Score table layout          | `src/components/GradeSheet.jsx`   |
| Roster behavior             | `src/components/RosterModal.jsx`  |
| Overall layout / state      | `src/App.jsx`                     |

## Next features to add

1. Final Grades / Summary view (average of Q1–Q4)
2. PDF export (jsPDF is already listed in `package.json`)
3. CSV import / export for class lists
4. Print-friendly layout
5. Login / multi-teacher support (can be ported from the old hybrid shell)

## Notes

- This is a clean foundation. It does **not** yet include every advanced feature from the old hybrid `react-shell` (IndexedDB bridge, login system, full PDF export, etc.).
- Existing teacher data stored under the old keys will need a small migration helper if you want to carry it over.
- The original single HTML file remains in the repo root so nothing is lost.
