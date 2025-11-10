const request = require('supertest');
const express = require('express');
const orgValRouter = require('../endpoints/organizationValidation');

describe('endpoints/organizationValidation.js', () => {
  function buildApp(mockQuery) {
    const app = express();
    app.use(express.json());
    app.use('/orgval', (req,_res,next)=>{ req.db = { query: mockQuery }; next(); }, orgValRouter);
    return app;
  }

  test('POST / missing username returns 400', async () => {
    const res = await request(buildApp(jest.fn())).post('/orgval/').send({ password: 'x' });
    expect(res.status).toBe(400);
  });

  test('POST / duplicate returns 409', async () => {
    const mockQuery = jest.fn().mockResolvedValueOnce({ rows: [{}] });
    const res = await request(buildApp(mockQuery)).post('/orgval/').send({ username: 'dup', password: 'pw' });
    expect(res.status).toBe(409);
  });

  test('POST / success returns 201', async () => {
    const mockQuery = jest.fn()
      .mockResolvedValueOnce({ rows: [] }) // duplicate check
      .mockResolvedValueOnce({ rows: [{ organizerUserName: 'new', organizerPassword: 'pw' }] });
    const res = await request(buildApp(mockQuery)).post('/orgval/').send({ username: 'new', password: 'pw' });
    expect(res.status).toBe(201);
    expect(res.body.organizer.organizerUserName).toBe('new');
  });
});
