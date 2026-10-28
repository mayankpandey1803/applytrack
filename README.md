# ApplyTrack

A local full-stack portfolio demo created with AI assistance for Mayank Raj. Review and understand the implementation before presenting it in an interview.

## Features
Application creation, status updates, company/role search, status filtering, summary counts, deletion and CSV export.

## Stack
Semantic HTML, responsive CSS, vanilla JavaScript, Node.js HTTP server, SQLite using Node's built-in `node:sqlite` module. No third-party runtime dependencies.

## Run
Install Node.js 24 or later, open a terminal in this folder and run:

```sh
npm start
```

Open http://127.0.0.1:3000. Database tables are created automatically. Data persists in `data.sqlite`. To run both projects together, set `PORT=3001` for one (PowerShell: `$env:PORT=3001`).

## Tests
```sh
npm test
```
Tests use a temporary database and an ephemeral server port. GitHub Actions runs the same suite on pushes and pull requests.

## Architecture
`public/app.js` calls JSON endpoints in `server.mjs`. The backend validates input and uses prepared SQL statements. The UI renders user content with `textContent`. `public/style.css` includes a mobile breakpoint. CSV export escapes fields and prefixes spreadsheet formula markers.

## Scope and limitations
This is a single-user local demo, not a production SaaS. It binds to loopback and has no login or authorization. Do not expose it publicly with real personal data. There is no claim of production traffic or measured performance. Add authentication, pagination and deployment configuration as future work. SQLite timestamps are UTC.

## Files
- `server.mjs`: HTTP routing, validation and persistence
- `public/`: frontend
- `tests/`: API integration tests
- `.github/workflows/test.yml`: CI

## Interview walkthrough
1. Start with the user problem and demonstrate the main flow.
2. Explain the fetch request, server route, prepared query and UI refresh.
3. Explain why validation is needed on both client and server.
4. Explain the tradeoff: minimal dependencies and simple local deployment versus no authentication or multi-user permissions.
5. Be clear that this project was AI-assisted; distinguish code you reviewed or modified from generated scaffolding.

## Companion project: StockDesk

[Open StockDesk](stockdesk/) for the independent inventory application. Run it from the `stockdesk` directory with `npm start` and `npm test`. Both applications share this repository, but have separate servers, databases and tests.

[Hinglish walkthrough](INTERVIEW_GUIDE.md)
