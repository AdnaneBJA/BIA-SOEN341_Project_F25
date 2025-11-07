const request = require('supertest');
const express = require('express');
const analyticsRouter = require('../EventAnalyticsHandler');

// Build an isolated app instance for testing only this router
function buildTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/', analyticsRouter);
  return app;
}

describe('EventAnalyticsHandler router', () => {
  let app;
  beforeAll(() => {
    app = buildTestApp();
  });

  describe('GET /:eventId', () => {
    test('returns analytics for a known event id', async () => {
      const res = await request(app).get('/1');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('eventID', '1');
      expect(res.body).toHaveProperty('analytics');

      expect(res.body.analytics).toMatchObject({
        attnedee: expect.any(Number),
        ticketsSold: expect.any(Number),
        revenue: expect.any(Number)
      });
    });

    test('returns 404 for unknown event id', async () => {
      const res = await request(app).get('/999');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Event not found');
    });
  });

  describe('POST /events', () => {
    test('rejects when required fields are missing', async () => {
      const res = await request(app).post('/events').send({ title: 'Missing fields' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'All fields are required');
    });

    test('creates a new event with all required fields', async () => {
      const payload = {
        title: 'Sample',
        date: '2025-11-07',
        location: 'Test Hall',
        description: 'A test event'
      };
      const res = await request(app).post('/events').send(payload);
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject(payload);
      expect(res.body).toHaveProperty('id');
      expect(typeof res.body.id).toBe('number');
    });
  });
});

