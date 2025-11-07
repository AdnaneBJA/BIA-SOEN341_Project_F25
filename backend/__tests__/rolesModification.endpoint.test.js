const request = require('supertest');
const express = require('express');
const rolesRouter = require('../endpoints/rolesModification');

function buildApp(db) {
  const app = express();
  app.use(express.json());
  app.use('/roles', (req, _res, next) => { req.db = db; next(); }, rolesRouter);
  return app;
}

describe('endpoints/rolesModification.js', () => {
  test('POST /assign requires userId', async () => {
    const app = buildApp({ query: jest.fn() });
    const res = await request(app).post('/roles/assign').send({});
    expect(res.status).toBe(400);
  });

  test('POST /assign converts organizer -> student (happy path)', async () => {
    const db = { query: jest.fn()
      // src SELECT (organizer)
      .mockResolvedValueOnce({ rows: [{ id: 7, username: 'u', password: 'p' }] })
      // events check (no events)
      .mockResolvedValueOnce({ rows: [] })
      // target username exists check
      .mockResolvedValueOnce({ rows: [] })
      // insert into target
      .mockResolvedValueOnce({ rows: [{ id: 42 }] })
      // delete from source
      .mockResolvedValueOnce({ rows: [] })
    };
    const app = buildApp(db);
    const res = await request(app).post('/roles/assign').send({ userId: 7, currentRole: 'organizer' });
    expect(res.status).toBe(200);
    expect(res.body.newId).toBe(42);
  });

  test('DELETE /revoke invalid role returns 400', async () => {
    const app = buildApp({ query: jest.fn() });
    const res = await request(app).delete('/roles/revoke/5');
    expect(res.status).toBe(400);
  });
});

