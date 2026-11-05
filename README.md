# EYVA Frontend

Next.js App Router + TypeScript + Tailwind CSS 4 frontend starter implementing the EYVA flows from the supplied PRD and UI/UX PDFs.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Routes
- `/` and `/home` — dashboard and setup/camera permission cards
- `/login`, `/register` — authentication UI (demo navigation)
- `/focus-session` — study timer, webcam placeholder, Alert 1/2 and advice demo controls
- `/break-session` — break timer
- `/summary` — session summary
- `/history` — session history
- `/statistics` — weekly metrics and drowsiness indicators
- `/profile` — username and avatar editor

## Integration notes
UI currently uses demo data and local navigation. API integration belongs in `src/services`; session logic in `src/hooks`; shared data contracts in `src/types`. Add real webcam capture/inference and backend event state machine before treating drowsiness alerts as production detections. The demo Alert 1/2 buttons are only for UI testing.

## Important
The supplied `eyva.zip` could not be opened as a valid ZIP archive in this environment (it has no readable central directory). This deliverable is a clean frontend implementation based on the supplied PDF designs and PRD, not a patch to the original source tree. Please re-upload the source archive if preserving its existing components is required.
"# eyva-frontend" 
