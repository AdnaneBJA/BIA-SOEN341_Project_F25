const request = require('supertest');
const express = require('express');

jest.mock('../db', () => ({ query: jest.fn() }));
const mockDb = require('../db');
const calendarRouter = require('../endpoints/calendar');

function buildApp() {
  const app = express();
  app.use('/calendar', calendarRouter);
  return app;
}

describe('endpoints/calendar.js', () => {
  let app;
  beforeEach(() => {
    jest.resetAllMocks();
    app = buildApp();
  });

  test('returns 404 if event not found', async () => {
    mockDb.query.mockResolvedValue({ rows: [] });
    const res = await request(app).get('/calendar/99');
    expect(res.status).toBe(404);
  });

  test('returns ICS file for existing event', async () => {
    mockDb.query.mockResolvedValue({ rows: [{
      eventID: 1,
      eventName: 'Sample Event',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 3600000).toISOString(),
      eventDescription: 'Desc',
      location: 'Room'
    }] });
    const res = await request(app).get('/calendar/1');
    expect(res.status).toBe(200);
    expect(res.text).toContain('BEGIN:VCALENDAR');
    expect(res.headers['content-type']).toMatch(/text\/calendar/);
  });
});

