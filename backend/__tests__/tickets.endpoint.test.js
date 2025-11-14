const request = require('supertest');
const express = require('express');

jest.mock('../qrCodeGenerator', () => ({ generateQRCodes: jest.fn(() => Promise.resolve({ qrPath: 'C:/fake/ticket_1.png', relPath: 'qrcodes/ticket_1.png', dataUrl: 'data:image/png;base64,AAA' })) }));
jest.mock('nodemailer', () => ({ createTransport: () => ({ sendMail: jest.fn().mockResolvedValue({}) }) }));

const ticketsFactory = require('../endpoints/tickets');

function appWith(client) {
  const app = express();
  app.use(express.json());
  app.use('/tickets', ticketsFactory(client));
  return app;
}

describe('endpoints/tickets.js', () => {
  test('GET /ticket/total returns count', async () => {
    const client = { query: jest.fn().mockResolvedValue({ rows: [{ count: '7' }] }) };
    const app = appWith(client);
    const res = await request(app).get('/tickets/ticket/total');
    expect(res.status).toBe(200);
    expect(res.body.ticketCount).toBe(7);
  });

  test('POST /validate-ticket requires id', async () => {
    const app = appWith({ query: jest.fn() });
    const res = await request(app).post('/tickets/validate-ticket').send({});
    expect(res.status).toBe(400);
  });

  test('POST /validate-ticket found returns 200', async () => {
    const client = { query: jest.fn().mockResolvedValue({ rows: [{ valid: true, eventID: 9 }] }) };
    const app = appWith(client);
    const res = await request(app).post('/tickets/validate-ticket').send({ ticketID: 1 });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
  });

  test('POST /claim-tickets free event happy path', async () => {
    const q = jest.fn()
      // BEGIN
      .mockResolvedValueOnce({})
      // SELECT event
      .mockResolvedValueOnce({ rows: [{ eventprices: 0, maxparticipants: 100, currentparticipants: 10, eventname: 'E' }] })
      // existing ticket
      .mockResolvedValueOnce({ rows: [] })
      // INSERT ticket returning id
      .mockResolvedValueOnce({ rows: [{ ticketid: 1 }] })
      // UPDATE ticket qr
      .mockResolvedValueOnce({})
      // UPDATE event count
      .mockResolvedValueOnce({})
      // COMMIT
      .mockResolvedValueOnce({});
    const client = { query: q };
    const app = appWith(client);
    const res = await request(app).post('/tickets/claim-tickets').send({ eventID: 2, studentID: 3 });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/claimed/);
    // ensure commit called
    expect(q.mock.calls[6][0]).toMatch(/COMMIT/);
  });

  test('POST /claim-tickets payment required branch', async () => {
    const q = jest.fn()
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ eventprices: 10, maxparticipants: 100, currentparticipants: 10, eventname: 'E' }] })
      .mockResolvedValueOnce({}); // ROLLBACK
    const client = { query: q };
    const app = appWith(client);
    const res = await request(app).post('/tickets/claim-tickets').send({ eventID: 2, studentID: 3 });
    expect(res.status).toBe(402);
  });
});
