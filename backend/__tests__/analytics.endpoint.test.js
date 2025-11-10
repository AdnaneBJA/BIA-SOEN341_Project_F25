const request = require('supertest');
const express = require('express');

// Mock the server client used inside analytics.js
jest.mock('../server', () => ({ query: jest.fn() }));
const mockClient = require('../server');
const analyticsRouter = require('../endpoints/analytics');

function appWith(router) {
  const app = express();
  app.use(express.json());
  app.use('/analytics', router);
  return app;
}

describe('endpoints/analytics.js', () => {
  let app;
  beforeEach(() => {
    jest.resetAllMocks();
    app = appWith(analyticsRouter);
  });

  test('GET /analytics/summary returns counts as numbers', async () => {
    mockClient.query
      .mockResolvedValueOnce({ rows: [{ count: '2' }] })
      .mockResolvedValueOnce({ rows: [{ count: '5' }] })
      .mockResolvedValueOnce({ rows: [{ count: '3' }] });

    const res = await request(app).get('/analytics/summary');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ totalEvents: 2, totalTickets: 5, totalParticipants: 3 });
  });

  test('GET /analytics/tickets/monthly returns rows', async () => {
    const rows = [{ month: '2025-01-01', tickets_sold: '10' }];
    mockClient.query.mockResolvedValueOnce({ rows });

    const res = await request(app).get('/analytics/tickets/monthly');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(rows);
  });

  test('GET /analytics/participation/type returns rows', async () => {
    const rows = [{ eventType: 'Music', participants: '7' }];
    mockClient.query.mockResolvedValueOnce({ rows });

    const res = await request(app).get('/analytics/participation/type');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(rows);
  });

  test('handles DB error on /analytics/summary', async () => {
    mockClient.query.mockRejectedValue(new Error('db boom'));
    const res = await request(app).get('/analytics/summary');
    expect(res.status).toBe(500);
  });
});

