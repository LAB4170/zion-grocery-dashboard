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

// ─── ADMIN AUTH TESTS ──────────────────────────────────────────────────────

describe('Admin Authentication Middleware (Firebase Enforced)', () => {
  test('GET /api/admin/overview → 401 when no Authorization header', async () => {
    const res = await request(app).get('/api/admin/overview');
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/Bearer token/i);
  });

  test('GET /api/admin/overview → 401 when using invalid token', async () => {
    const res = await request(app)
      .get('/api/admin/overview')
      .set('Authorization', 'Bearer invalid_token');
    expect(res.status).toBe(401);
  });

  test('GET /api/admin/businesses → 401 with no token', async () => {
    const res = await request(app).get('/api/admin/businesses');
    expect(res.status).toBe(401);
  });

  test('GET /api/admin/activities → 401 with no token', async () => {
    const res = await request(app).get('/api/admin/activities');
    expect(res.status).toBe(401);
  });

  test('GET /api/admin/audit-log → 401 with no token', async () => {
    const res = await request(app).get('/api/admin/audit-log');
    expect(res.status).toBe(401);
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
