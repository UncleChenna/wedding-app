# Ticket

Ticket: TICKET-120

# Summary

Personal invitations, passes, ordering, staff and admin pages must never show up in search. Before this PR the
coverage was uneven:

- Some pages set noindex in their metadata, and the proxy set the header for `/i`, `/p`, `/dev` and the staff boards.
- `/order`, `/staff`, `/offline` and `/invitation-preview` sent no `X-Robots-Tag` header.
- There was no robots.txt.

After this PR:

- Every private route prefix sends `X-Robots-Tag: noindex, nofollow` from one list.
- `/robots.txt` disallows the staff, admin, dev and api paths.
- The home page and `/invite` stay indexable.

Started ahead of TICKET-047, which only touches invite-link previews.

# Changes

- **`src/modules/shared/lib/search-privacy.ts`** (new):
  - `PRIVATE_ROUTE_PREFIXES` and `noindexHeaderRules()` drive the header.
  - `ROBOTS_DISALLOW` drives robots.txt.
  - The header value matches the one `src/proxy.ts` already sets, so routes covered by both send one consistent
    value.
- **`next.config.ts`:** adds the noindex rules for every private prefix and its children. `/admin` keeps
  `Referrer-Policy: no-referrer`; its robots header now comes from the shared list.
- **`src/app/robots.ts`** (new): `User-Agent: *`, `Allow: /`, and the staff, admin, dev and api disallows.
- **Why robots.txt doesn't block `/i` or `/p`:** a robots.txt block would also stop link-preview crawlers (WhatsApp)
  reading those pages' Open Graph tags. The noindex header keeps them out of search instead.
- **Tests:**
  - unit: `src/modules/shared/__tests__/search-privacy.test.ts`
  - e2e smoke: `e2e/search-privacy.spec.ts`, covering headers on 10 private routes, the public home and robots.txt

# Acceptance criteria and evidence

- [x] **Every private route returns noindex.** The `e2e/search-privacy.spec.ts` smoke test checks this. Manual check
      on a production build (`pnpm build && pnpm start`):

  | Route                | Response                | `X-Robots-Tag`                 |
  | -------------------- | ----------------------- | ------------------------------ |
  | `/order`             | 200                     | `noindex, nofollow`            |
  | `/staff`             | 200                     | `noindex, nofollow`            |
  | `/offline`           | 200                     | `noindex, nofollow`            |
  | `/checkin`           | 200                     | `noindex, nofollow`            |
  | `/kitchen`           | 200                     | `noindex, nofollow`            |
  | `/bar`               | 200                     | `noindex, nofollow`            |
  | `/admin/sign-in`     | 200                     | `noindex, nofollow`            |
  | `/admin`             | 307 to sign-in          | `noindex, nofollow`            |
  | `/dev`, `/dev/theme` | 404                     | `noindex, nofollow`            |
  | `/i/x`, `/p/x`       | 503 (no local database) | `noindex, nofollow, noarchive` |
  | `/`, `/invite`       | 200                     | none                           |

  Every route sent a single header, never a duplicate.

- [x] **robots.txt disallows staff and admin.** The production build served:

  ```
  User-Agent: *
  Allow: /
  Disallow: /staff
  Disallow: /checkin
  Disallow: /kitchen
  Disallow: /bar
  Disallow: /admin
  Disallow: /dev
  Disallow: /api
  ```

# Verification

- `vitest run` on `search-privacy` and `security-headers`: 7 passed.
- ESLint on the changed files: clean.
- `pnpm build`: succeeded.
- Manual header checks: as in the table above.
- **Not run locally:** the e2e specs. Every local Supabase stack on this machine is reporting unhealthy in Docker, so
  routes that need the database couldn't be exercised end to end here. CI's `pnpm verify` and the smoke job run them
  with a fresh database.

# Risks and rollout

- **Shared links:** search engines that already crawled `/order` would drop it, which is intended. Open Graph previews
  are unaffected, because nothing personal is blocked in robots.txt.
- **Rollback:** revert the PR. No data or schema change.

# Screenshots

N/A: headers and robots.txt only, with no visual change.

# UI checklist

N/A: no rendered UI changed. Only response headers and a new `/robots.txt` route.

- [x] **Verification:** `verify:quick` runs in `t:pr`; the full `pnpm verify` runs in CI.

# Harness changes, if any

None.
