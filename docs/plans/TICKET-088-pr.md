# Ticket

Ticket: TICKET-088

# Summary

Admin pages had no shared frame: each page carried its own sign-out link, and there was no navigation between sections.
Every protected admin page now sits in one shell, showing the event name (the couple's names from settings), with
navigation to Control room, Sharing and Sign out. On phones the navigation is a bar pinned to the bottom, within thumb
reach; from `md` up it's a sidebar. Signed-out visitors are still redirected to sign-in.

# Changes

- `src/modules/admin/components/admin-shell.tsx`: the layout, plus `adminSections`, where feature tickets add their
  pages.
- `admin-nav-link.tsx`: the only client component, marking the current page with `aria-current`.
- `admin-frame.tsx`: reads the event name from settings and renders the shell.
- `src/app/(admin)/admin/(protected)/layout.tsx`: wraps protected pages in the shell after the access gate.
- `admin-dashboard.tsx`: the duplicate sign-out and back links are removed; the shell provides sign-out.
- `/dev/admin` (`admin-shell-preview.tsx`, `src/app/dev/admin/page.tsx`): a sample-content preview, registered in
  `routes.ts`, linked from `/dev`, and added to `docs/journeys.md`.
- Tests:
  - `admin-shell.test.tsx`: section links and the current-page mark
  - `admin-dashboard.test.tsx`: updated for the moved sign-out link
  - `e2e/admin-shell.spec.ts`: keyboard order, layout and theme checks
  - `e2e/access-matrix.spec.ts`: now asserts the redirect goes to sign-in

# Acceptance criteria and evidence

- [x] **Navigation works by keyboard and at 375px (end-to-end).**
  - Tab reaches the three links in order, each with a visible outline, and Enter follows a link.
  - At 375px the bar is pinned to the bottom edge, the last content scrolls clear of it, every link is at least 44×44,
    and nothing scrolls sideways.
  - At 768 and 1280 it's a sidebar.
  - Axe finds nothing in all four themes.
- [x] **Signed-out access redirects to sign-in.** The access-matrix test asserts `/admin` and `/admin/sharing` return a
      307 to `/admin/sign-in`. The keyboard test follows a shell link and lands on the sign-in page.

# Verification

- `vitest run src/modules/admin src/modules/shared/__tests__/routes.test.ts`: 48 passed.
- `playwright test e2e/admin-shell.spec.ts e2e/access-matrix.spec.ts e2e/a11y-routes.spec.ts --project=mobile`: 107
  passed on a production build. The a11y suite now includes `/dev/admin`.
- `pnpm typecheck`, ESLint and Prettier: clean. Full `pnpm verify`: run by `pnpm t:pr`; see CI.
- **Not verified:** a signed-in run of the real `/admin` inside the shell. It needs local Supabase Auth, which wasn't
  available, or the hosted dev project proposed in TICKET-213. Real phones aren't verified either.

# Risks and rollout

- No schema, migration, dependency, CI or RLS changes. Access checks are unchanged; the shell renders only after the
  gate.
- To roll back, revert this PR.

# Screenshots

`docs/reviews/TICKET-088/<theme>/<width>.png` covers all four themes at 375, 768 and 1280px.

# UI checklist

Recorded item by item in `docs/reviews/TICKET-088/REVIEW.md`.

- **Pass:** screenshots, tokens, typography, mobile, keyboard, contrast, copy.
- **N/A:** motion, images, performance (admin screen), QR, staff feedback.
- **Not verified:** devices.

# Harness changes, if any

None.
