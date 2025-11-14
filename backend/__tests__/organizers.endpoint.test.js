const request = require('supertest');
const express = require('express');
const organizersFactory = require('../endpoints/organizers');

describe('endpoints/organizers.js', () => {
  test('GET / returns organizers', async () => {
    const mockClient = { query: jest.fn().mockResolvedValue({ rows: [{ organizerID: 1, organizerUserName: 'a', approved: false }] }) };
    const app = express();
    app.use('/organizers', organizersFactory(mockClient));
    const res = await request(app).get('/organizers/');
    expect(res.status).toBe(200);
    expect(res.body[0].organizerID).toBe(1);
  });

  test('POST /toggle-approval requires fields', async () => {
    const mockClient = { query: jest.fn() };
    const app = express();
    app.use(express.json());
    app.use('/organizers', organizersFactory(mockClient));
    const res = await request(app).post('/organizers/toggle-approval').send({ organizerID: 1 });
    expect(res.status).toBe(400);
  });

  test('POST /toggle-approval updates and returns organizer', async () => {
    const mockClient = { query: jest.fn().mockResolvedValue({ rows: [{ organizerID: 1, organizerUserName: 'a', approved: true }] }) };
    const app = express();
    app.use(express.json());
    app.use('/organizers', organizersFactory(mockClient));
    const res = await request(app).post('/organizers/toggle-approval').send({ organizerID: 1, approved: true });
    expect(res.status).toBe(200);
    expect(res.body.organizer.approved).toBe(true);
  });
});

