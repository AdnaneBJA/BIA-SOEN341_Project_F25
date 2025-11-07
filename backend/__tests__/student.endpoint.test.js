const request = require('supertest');
const express = require('express');
const studentFactory = require('../endpoints/student');

function appWith(client) {
  const app = express();
  app.use(express.json());
  app.use('/student', studentFactory(client));
  return app;
}

describe('endpoints/student.js', () => {
  test('GET / returns working message', async () => {
    const app = appWith({ query: jest.fn() });
    const res = await request(app).get('/student/');
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/Student endpoint is working/);
  });

  test('POST / missing fields returns 400', async () => {
    const app = appWith({ query: jest.fn() });
    const res = await request(app).post('/student/').send({ username: 'x' });
    expect(res.status).toBe(400);
  });

  test('GET /tickets/:studentID maps qrCode to url', async () => {
    const client = { query: jest.fn().mockResolvedValue({ rows: [{ qrCode: 'qrcodes/ticket_1.png', ticketID: 1, eventID: 2, purchaseTime: new Date(), valid: true, eventName: 'E', location: 'L', eventDate: new Date() }] }) };
    const app = appWith(client);
    const res = await request(app).get('/student/tickets/10');
    expect(res.status).toBe(200);
    expect(res.body[0].qrCodeUrl).toMatch(/qrcodes\/ticket_1\.png/);
  });

  test('POST /saved-events requires fields', async () => {
    const app = appWith({ query: jest.fn() });
    const res = await request(app).post('/student/saved-events').send({ studentID: 1 });
    expect(res.status).toBe(400);
  });
});

