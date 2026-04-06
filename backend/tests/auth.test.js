/**
 * Integration Tests: Admin Authentication & Security
 * 
 * Tests the full auth middleware chain against the live Express app.
 * Run: npm test
 */

const request = require('supertest');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Import the app (not server.listen, just the express app)
const app = require('../server');

const VALID_ADMIN_KEY = process.env.ADMIN_SECRET;

// ─── ADMIN AUTH TESTS ──────────────────────────────────────────────────────

describe('Admin Authentication Middleware', () => {
  test('GET /api/admin/overview → 401 when no x-admin-key header', async () => {
    const res = await request(app).get('/api/admin/overview');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/admin/overview → 401 when x-admin-key is wrong', async () => {
    const res = await request(app)
      .get('/api/admin/overview')
      .set('x-admin-key', 'completely_wrong_key_that_wont_work!!');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/admin/overview → 200 with correct x-admin-key', async () => {
    const res = await request(app)
      .get('/api/admin/overview')
      .set('x-admin-key', VALID_ADMIN_KEY);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  test('GET /api/admin/overview response has required metric fields', async () => {
    const res = await request(app)
      .get('/api/admin/overview')
      .set('x-admin-key', VALID_ADMIN_KEY);
    const { data } = res.body;
    expect(data).toHaveProperty('totalBusinesses');
    expect(data).toHaveProperty('totalRevenue');
    expect(data).toHaveProperty('retentionRate');
    expect(data).toHaveProperty('growth');
    expect(data.growth).toHaveProperty('revenue');
    expect(data.growth).toHaveProperty('activeTenants');
  });

  test('GET /api/admin/businesses → 401 with no key', async () => {
    const res = await request(app).get('/api/admin/businesses');
    expect(res.status).toBe(401);
  });

  test('GET /api/admin/businesses → 200 with valid key and returns array', async () => {
    const res = await request(app)
      .get('/api/admin/businesses')
      .set('x-admin-key', VALID_ADMIN_KEY);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /api/admin/activities → 401 with no key', async () => {
    const res = await request(app).get('/api/admin/activities');
    expect(res.status).toBe(401);
  });

  test('GET /api/admin/audit-log → 200 with valid key and returns audit records', async () => {
    const res = await request(app)
      .get('/api/admin/audit-log')
      .set('x-admin-key', VALID_ADMIN_KEY);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('ADMIN_SECRET must be ≥32 characters (entropy check)', () => {
    expect(VALID_ADMIN_KEY).toBeDefined();
    expect(VALID_ADMIN_KEY.length).toBeGreaterThanOrEqual(32);
  });
});

// ─── BUSINESS AUTH TESTS ───────────────────────────────────────────────────

describe('Business Auth Middleware (requireBusinessAuth)', () => {
  test('GET /api/sales → 401 with no Authorization header', async () => {
    const res = await request(app).get('/api/sales');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/token/i);
  });

  test('GET /api/products → 401 with no Authorization header', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(401);
  });

  test('GET /api/expenses → 401 with no Authorization header', async () => {
    const res = await request(app).get('/api/expenses');
    expect(res.status).toBe(401);
  });

  test('GET /api/sales → 401 with malformed bearer token', async () => {
    const res = await request(app)
      .get('/api/sales')
      .set('Authorization', 'Bearer not_a_real_token');
    // Firebase will reject it — expect 401
    expect(res.status).toBe(401);
  });
});

// ─── TENANT GUARD TESTS ────────────────────────────────────────────────────

describe('Tenant Guard Sanity', () => {
  test('GET /health → 200 (public route, no auth needed)', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
  });

  test('GET /api/unknown-route → 404', async () => {
    const res = await request(app).get('/api/this-route-does-not-exist');
    expect(res.status).toBe(404);
  });
});
