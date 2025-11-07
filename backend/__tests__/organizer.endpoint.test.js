const request = require('supertest');
const express = require('express');
const organizerFactory = require('../endpoints/organizer');

describe('endpoints/organizer.js', () => {
  test('GET / returns organizer rows', async () => {
    const mockClient = { query: jest.fn().mockResolvedValue({ rows: [{ organizerID: 1 }] }) };
    const app = express();
    app.use('/organizer', organizerFactory(mockClient));
    const res = await request(app).get('/organizer/');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('POST / missing username/password returns 400', async () => {
    const mockClient = { query: jest.fn() };
    const app = express();
    app.use(express.json());
    app.use('/organizer', organizerFactory(mockClient));
    const res = await request(app).post('/organizer/').send({ username: 'x' });
    expect(res.status).toBe(400);
  });

  test('POST / creates organizer', async () => {
    const mockClient = { query: jest.fn().mockResolvedValue({ rows: [{ organizerUserName: 'u' }] }) };
    const app = express();
    app.use(express.json());
    app.use('/organizer', organizerFactory(mockClient));
    const res = await request(app).post('/organizer/').send({ username: 'u', password: 'p' });
    expect(res.status).toBe(201);
  });
});

