# Sideout · Volleyball rotation board

A responsive, dependency-free lineup planner built with HTML, CSS, and JavaScript for GitHub Pages.

## Use

The rotation roster controls every assignment. Drag a player's handle to another slot (mouse or touch), or use the up/down arrows. Slots 1–6 are back middle, back left, front left, front middle, front right, and server. Remaining slots form the FIFO bench queue. Courts and the bench display this order without separate assignment controls. Check any number of players in the roster to highlight their jerseys with a gold star on every court. Highlights follow players through rotations and reordering, and are saved and included in lineup exports.

Rotation: **bench → back middle → back left → front left → front middle → front right → server → bench**. With no bench, the server moves directly to back middle. Removing a player shifts later roster slots up; a minimum of six players is required.

Upcoming rotations appear below the live court and default to three. Use **Show** to choose a count or **All** to see every unique future lineup before the live lineup repeats. A roster of N players repeats after N rotations, so there are N−1 unique future lineups. Previews update whenever the roster changes. Rotate team advances the live lineup one rotation. Undo restores the previous edit or rotation. The lineup saves automatically in this browser; existing saved and exported lineups remain compatible. Export/import JSON to transfer it between devices.

## Local development

Run `python3 -m http.server 8000` and open http://localhost:8000. Run `npm test` (Node.js 18 or later) for rotation and validation tests. There are no dependencies or build steps. Fonts fall back to system sans-serif when offline.

## GitHub Pages

In the repository's **Settings → Pages → Build and deployment → Source**, select **GitHub Actions**. Commit and push to `main` or `master`, or manually run the Deploy GitHub Pages workflow. It runs the tests and deploys only the four application files.

Expected URL after deployment: https://thumbard.github.io/volleyball-rotation/
