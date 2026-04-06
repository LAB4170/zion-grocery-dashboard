# Gap Plan: Admin Command Center — Post-Milestone Improvements

**Created:** 2026-04-07  
**Based on:** Milestone Audit findings

---

## Gap 1: No Integration Tests (🔴 High)

### Problem
All verification is manual or script-based. Auth middleware bugs went undetected until runtime. A regression in `auth.js` or `adminAuth.js` would silently break authentication with no automated signal.

### Plan

**Phase A — Backend auth tests (Jest)**
1. Install Jest + supertest: `npm install -D jest supertest`
2. Create `backend/tests/auth.test.js`:
   - Test 1: `GET /api/admin/overview` with no header → expect 401
   - Test 2: `GET /api/admin/overview` with wrong key → expect 401
   - Test 3: `GET /api/admin/overview` with valid key → expect 200
   - Test 4: `GET /api/products` with no token → expect 401
   - Test 5: `GET /api/products` with invalid token → expect 401
3. Add `"test": "jest"` to `backend/package.json`
4. Run in CI on every push

**Effort:** ~3-4 hours | **Risk if skipped:** High

---

## Gap 2: On-the-Fly Aggregate SQL (🟡 Medium)

### Problem
`GET /api/admin/overview` runs 5 aggregate SQL queries on every request. With 100+ businesses, query time will grow to 2-5 seconds per load.

### Plan

**Phase A — Create `business_stats` table**
```sql
CREATE TABLE business_stats (
  business_id UUID PRIMARY KEY REFERENCES businesses(id),
  total_revenue NUMERIC DEFAULT 0,
  total_sales INT DEFAULT 0,
  last_activity_at TIMESTAMP,
  health_status VARCHAR(20),
  days_since_activity INT,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Phase B — Create background worker script**
1. Create `backend/workers/refreshBusinessStats.js`
2. Run every 15 minutes via `node-cron`
3. Populate `business_stats` with pre-computed values

**Phase C — Update admin routes**
1. `GET /api/admin/businesses` reads from `business_stats` JOIN `businesses` instead of subqueries
2. `GET /api/admin/overview` aggregates from `business_stats` table

**Effort:** ~5-6 hours | **Risk if skipped:** Medium (performance degrades at scale)

---

## Gap 3: Admin Auth → Firebase Custom Claims (🟡 Medium)

### Problem
`ADMIN_SECRET` is a static string. It has no identity — if it leaks, all admin actions look the same. It can't be revoked per-user. It has no audit trail.

### Plan

**Phase A — Add `admin` custom claim in Firebase**
```js
// One-time setup script: backend/scripts/setAdminClaim.js
admin.auth().setCustomUserClaims(uid, { role: 'admin' });
```

**Phase B — Update `adminAuth.js`**
Replace header check with Firebase token claim validation:
```js
const decodedToken = await admin.auth().verifyIdToken(token);
if (decodedToken.role !== 'admin') return res.status(403)...
```

**Phase C — Update `AdminDashboard.jsx`**
Replace password field with "Login with Google" button (reuse existing Firebase auth), pass `Authorization: Bearer <token>` header instead of `x-admin-key`.

**Effort:** ~4-5 hours | **Risk if skipped:** Medium (security posture risk, no audit trail)

---

## Gap 4: Admin Audit Log (🔴 High)

### Problem
There is no record of when admin views a business's sensitive data. This is a compliance risk.

### Plan

**Phase A — Create `admin_audit_log` table**
```sql
CREATE TABLE admin_audit_log (
  id SERIAL PRIMARY KEY,
  action VARCHAR(100) NOT NULL,
  target_business_id UUID REFERENCES businesses(id),
  admin_identifier VARCHAR(255),
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Phase B — Add audit middleware**
```js
// Logs automatically for all /api/admin/* routes
const auditLog = (action) => async (req, res, next) => {
  await db('admin_audit_log').insert({
    action,
    target_business_id: req.params.id || null,
    admin_identifier: 'system', // becomes uid after Gap 3
    ip_address: req.ip
  });
  next();
};
```

**Effort:** ~2-3 hours | **Risk if skipped:** High (compliance/GDPR exposure)

---

## Execution Order

| Order | Gap | Effort | Priority |
|-------|-----|--------|----------|
| 1 | Admin Audit Log | 2-3h | 🔴 High |
| 2 | Integration Tests | 3-4h | 🔴 High |
| 3 | Firebase Custom Claims | 4-5h | 🟡 Medium |
| 4 | Background Stats Worker | 5-6h | 🟡 Medium |
