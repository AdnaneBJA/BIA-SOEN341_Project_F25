const request = require('supertest');
const express = require('express');
const factory = require('../endpoints/eventdashboard');

describe('endpoints/eventdashboard.js', () => {
  test('GET / with organizerID returns rows', async () => {
    const mockClient = { query: jest.fn().mockResolvedValue({ rows: [{ eventID: 1, eventName: 'E1' }] }) };
    const app = express();
    app.use('/dash', factory(mockClient));
    const res = await request(app).get('/dash/?organizerID=5');
    expect(res.status).toBe(200);
    expect(res.body[0].eventName).toBe('E1');
  });

  test('GET / without organizer identity returns 403', async () => {
    const mockClient = { query: jest.fn() };
    const app = express();
    app.use('/dash', factory(mockClient));
    const res = await request(app).get('/dash/');
    expect(res.status).toBe(403);
  });

  test('GET /tickets-issued/:eventID returns aggregate row', async () => {
    const mockClient = { query: jest.fn().mockResolvedValueOnce({ rows: [{ eventID: 9, eventName: 'Evt', total_tickets: 3 }] }) };
    const app = express();
    app.use('/dash', factory(mockClient));
    const res = await request(app).get('/dash/tickets-issued/9');
    expect(res.status).toBe(200);
    expect(res.body.total_tickets).toBe(3);
  });
});

