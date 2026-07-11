# NeighborLearn

A community **time-banking** skill-exchange website. Teach a skill to earn
time-credits, spend them learning something new — no money involved.

Built for **Assignment 3 (Web Development Technologies)** from the Assignment 1/2 plan.

## Tech stack

| Layer         | Technology                              |
|---------------|-----------------------------------------|
| Structure     | HTML5 (multi-page)                      |
| Styling       | CSS3 (custom warm theme) + Bootstrap 5  |
| Interactivity | Vanilla JavaScript                      |
| Backend       | Python (standard library only — no pip) |
| Data storage  | Local JSON file (`data.json`)           |

The frontend is static HTML/CSS/JS in `public/`. A small Python server
(`app.py`) serves those files and exposes a simple JSON API so this coursework
prototype can save demo data to `data.json`. No frameworks, database, or build
tools are required.

## How to run

You need Python 3 (already on macOS / most Linux). From the project root:

```bash
python3 app.py
```

Open **http://localhost:8000** in your browser.

> The site talks to the Python backend, so it must be run this way —
> opening `index.html` directly (double-click) will not load the data.

## API (used internally by the frontend)

| Method | Path      | What it does                         |
|--------|-----------|--------------------------------------|
| GET    | `/api/db` | returns the whole database as JSON   |
| POST   | `/api/db` | saves the posted JSON to `data.json` |

## Demo account

| Email              | Password    |
|--------------------|-------------|
| `ethan@mail.com`   | `password1` |

You can also register a brand-new account (you get 3 welcome credits).

> This is a local coursework prototype. Its file-based storage and demo login
> are designed for classroom use, not production security or multiple users
> accessing the data at the same time.

## Suggested demo flow

Login with the demo account → Browse and search/filter skills → Open a skill
detail page → Book a session → My Bookings → Mark the session complete →
Dashboard (see the updated session statistics and time-credit balance).

## Project structure

```
app.py              Local server (serves public/ + JSON API)
data.json           Coursework demo data (the app reads and writes this file)
README.md
public/             The website (this is what gets served) — 8 pages
  index.html          Home
  browse.html         Browse / search / category filter
  skill-detail.html   One skill + booking
  login.html          Login
  register.html       Register (with validation)
  profile.html        User dashboard (profile, stats, session history)
  bookings.html       My bookings (mark complete / cancel)
  messages.html       Messages (two-pane conversations)
  css/style.css       Theme + all styling (colours in :root)
  img/                Photos (skill categories, hero) + assets
  js/store.js         Data layer — talks to the Python API
  js/common.js        Navbar, footer, shared helpers
  js/<page>.js        Logic for each page
```

> Leaving reviews and an admin panel were intentionally left out to keep the
> scope focused — they are discussed in the report's "Potential Improvements"
> section.

> **Reset the data:** `data.json` is a plain file that the app writes to. To
> restore the original demo data, undo your changes with Git
> (`git checkout data.json`).
