# document-pipeline-ui

React + TypeScript console for the document-pipeline-api. No auth (matches
the backend). Server state via TanStack Query, client/session UI state via
Zustand — the two are kept strictly separate: Zustand never holds anything
that came from the API (see `src/store/useUiStore.ts` for the reasoning).

## Setup

cp .env.example .env
npm install
npm run dev

Requires document-pipeline-api running (default http://localhost:3000)
with CORS allowing the dev origin.

## Known gaps

- No per-document query history persistence — session-only in Zustand.
- No polling backoff — fixed interval (1.2–1.5s).