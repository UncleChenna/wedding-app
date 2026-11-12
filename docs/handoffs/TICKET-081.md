# TICKET-081 — 2026-11-12 checkpoint

Owned branch/worktree TICKET-081; baseeb145497, claimed via supported --ahead while merged075 awaits verified closure. No product source changed. New opt-in e2e/order-performance.spec.ts exposes the genuine cold-transfer failure for table form and selected menu; expected200,000 vs1,239,803/1,227,649 actual. Production build passes. Exploratory raw request breakdown saved in docs/reviews/TICKET-081/cold-baseline.json. The first harness attempt lacked contextbaseURL; fixed before collecting these budget failures. No timeout or budget was increased.

Owned native PostgreSQL36761 (path in.harness/temporary-postgres-path) holds only synthetic performance fixtures and applied existing migrations. Production server36771 is a local measurement server. Other collaborators' Docker stacks are untouched. Native database is sufficient forbytes, not actual Realtime delivery; that needs the owned Supabase stack later.

Next: reduce eager offline font downloads and inspect framework/font cost before choosing changes; retain all-theme and offline behavior. Add real guest-submit to authenticated kitchen/bar visible arrival timing with documented slow4G and strict<2s. Do not modify collaborator079's ordering work. Required CI gate not yetwired; draft only, no doneclaim.

## 2026-11-12 measured investigation

Direct imports for root ToastProvider, TableForm, MenuSections and OrderComposer
were built and measured with unchanged fonts/worker and the strict cold tests.
Results remained red:1,238,050 bytes table form and1,228,706 menu, versus200,000.
No consistent useful saving; substitutions reverted rather than shipping noise.
Patch retained locally /tmp/TICKET-081-direct-import-experiment.patch.

A separate worker regression proved CSS crawling downloads undeclared complete
fonts (1red/33green). Preload-only prototype passed34tests, but independent
review correctly noted Playfair/Jost are not HTML-preloaded: cold offline themes
could lose their intended faces. Entire prototype reverted, not committed as a
fix; patch /tmp/TICKET-081-offline-preload-prototype.patch. Do not waive fonts.

Client manifest points to global-error.tsx runtime theme validation as a consumer
of the32KB Zod chunk (alongside menu), while React/Next chunks are73KB+37KB.
Current actually used normal fonts are37KB Cormorant+49KB Inter, plusunused39KB
italic preload. Next: explicit minimal offline asset/font-subset contract and
validated error-theme build output/lazy boundary, then honest cold remeasurement.
A larger architectural change needs evidence, not an inflated budget or delayed
measurement window. Owned native DB36761 stopped with data retained; production
measurement server also stopped by Playwright. No Supabase or Realtime proof yet.
