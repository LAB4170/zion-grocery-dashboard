# TODO.md — Nexus POS

> Captured via /add-todo workflow | Last updated: 2026-04-07

---

## 🔴 High Priority

- [ ] **Add Jest integration tests** for `requireBusinessAuth`, `requireAdminAuth`, and `requireTenantContext` middleware — prevents auth regressions silently reaching prod `high` — 2026-04-07
- [ ] **Add admin audit log table** — Record `(admin_uid, action, target_business_id, timestamp)` for every admin read/write to meet compliance requirements `high` — 2026-04-07

---

## 🟡 Medium Priority

- [ ] **Introduce `business_stats` pre-computation table** — Move aggregate SQL calculations to a background cron job (every 15 min), admin dashboard reads from pre-computed table for performance at scale `medium` — 2026-04-07
- [ ] **Migrate admin auth to Firebase Custom Claims** — Replace static `x-admin-key` header with `role: 'admin'` JWT claim for named audit trails and secret-less auth `medium` — 2026-04-07
- [ ] **Document `ADMIN_SECRET` rotation procedure** — Add to `RENDER_DEPLOYMENT.md` with zero-downtime steps `medium` — 2026-04-07

---

## 🟢 Low Priority

- [ ] **Load test `/api/admin/overview`** — Benchmark with 50+ businesses to establish performance baseline before production deployment `low` — 2026-04-07
- [ ] **Set up Sentry or error monitoring** — Replace `console.error` in middleware with structured alerting for production visibility `low` — 2026-04-07
- [ ] **Admin Quick Actions** — Implement "Extend Trial" / "Flag for Review" actions in the merchant detail panel `low` — 2026-04-07

---

## ✅ Completed

- [x] Backend intelligence: MoM Revenue Growth, 30-day Retention Rate, Churn/Health Classification
- [x] Premium Command Center UI with health badges, trend charts, deep-dive panel
- [x] Fix stray `}` in `auth.js` causing 500 on business onboarding route
- [x] Fix duplicate `requireAdminAuth` middleware causing admin endpoint 500s
- [x] Fix missing `return ()` in `AdminDashboard.jsx` causing Vite 500 compile error
- [x] Security audit: 4/4 tests passed
- [x] Firebase credential JSON confirmed git-ignored
