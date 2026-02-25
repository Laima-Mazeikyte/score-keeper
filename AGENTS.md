# AGENTS.md

## Cursor Cloud specific instructions

### Overview

**Game Night** is a vanilla HTML/CSS/JavaScript static web app for keeping score during board/card game nights. There is no build step, no framework, no backend, and no database — all state is stored in browser `localStorage`.

### Running the dev server

```bash
npm run serve
```

This runs `npx serve .` which serves static files on port 3000 by default. Open `http://localhost:3000` in a browser.

### Caveats

- **No build step**: The app uses plain HTML/CSS/JS with no transpilation or bundling.
- **No automated tests or linter**: The project does not include any test framework or linting configuration.
- **Audio requires HTTP**: Opening `index.html` via `file://` will cause `fetch()` failures for the click sound (`sounds/click.wav`). Always use the dev server.
- **localStorage persistence**: The app saves player state to `localStorage`, so refreshing the page retains player names/scores from the previous session.
