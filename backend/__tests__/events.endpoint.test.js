const request = require('supertest');
const express = require('express');
const eventsFactory = require('../endpoints/events');

describe('endpoints/events.js', () => {
  test('GET / returns all events', async () => {
    const mockClient = { query: jest.fn().mockResolvedValue({ rows: [{ eventID: 1 }] }) };
    const app = express();
    app.use('/events', eventsFactory(mockClient));
    const res = await request(app).get('/events/');
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/Retrieving/);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('POST / missing required fields returns 400', async () => {
    const mockClient = { query: jest.fn() };
    const app = express();
    app.use(express.json());
    app.use('/events', eventsFactory(mockClient));
    const res = await request(app).post('/events/').send({ eventName: 'X' });
    expect(res.status).toBe(400);
  });

  test('DELETE /:eventID returns 404 if not found', async () => {
    const mockClient = { query: jest.fn()
      .mockResolvedValueOnce({ rows: [] }) // delete tickets result
      .mockResolvedValueOnce({ rows: [] }) // delete event result (none deleted)
    };
    const app = express();
    app.use('/events', eventsFactory(mockClient));
    const res = await request(app).delete('/events/55');
    expect(res.status).toBe(404);
  });
});
