# Frontend tests

Unit and component tests live next to the code in `src/frontend/src/**/*.test.ts(x)` and run with:

```bash
cd src/frontend
npm test
```

| Test file | What it checks | Plan reference (docs/09) |
|---|---|---|
| `lib/conflicts.test.ts` | Teacher / room / group conflicts, odd/even weeks, capacity and room type warnings | FR-08, FR-09 |
| `lib/schedule.test.ts` | Week numbering, week parity, next lesson | FR-12 |
| `api/mockClient.test.ts` | 409 / 422 / 401 responses of the mock API, free rooms | FR-08, FR-09, FR-13 |
| `pages/SchedulePage.test.tsx` | Group schedule and day filter | T-E2E-01 (component level) |
| `pages/AdminEntriesPage.test.tsx` | Conflict message, entry not saved; group required | T-E2E-02 (component level) |

This folder is reserved for Playwright end-to-end tests (desktop and 360 px viewports), planned once the backend is running.
