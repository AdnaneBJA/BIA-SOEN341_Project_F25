const request = require('supertest');
const express = require('express');
const orgModRouter = require('../endpoints/organizationModification');

describe('endpoints/organizationModification.js', () => {
  function buildApp(queryMock) {
    const app = express();
    app.use(express.json());
    app.use('/organizations', (req, _res, next) => { req.db = { query: queryMock }; next(); }, orgModRouter);
    return app;
  }

  test('GET / returns mapped organizations', async () => {
    const mockQuery = jest.fn().mockResolvedValue({ rows: [ { organizationID: 1, organizationName: 'OrgA', description: 'Desc', createdAt: new Date().toISOString() } ] });
    const res = await request(buildApp(mockQuery)).get('/organizations/');
    expect(res.status).toBe(200);
    expect(res.body.organizations[0].name).toBe('OrgA');
  });

  test('POST / missing name returns 400', async () => {
    const res = await request(buildApp(jest.fn())).post('/organizations/').send({ description: 'x' });
    expect(res.status).toBe(400);
  });

  test('POST / creates organization', async () => {
    const mockQuery = jest.fn().mockResolvedValue({ rows: [ { organizationID: 3, organizationName: 'NewOrg', description: 'D' } ] });
    const res = await request(buildApp(mockQuery)).post('/organizations/').send({ name: 'NewOrg', description: 'D' });
    expect(res.status).toBe(201);
    expect(res.body.organization.name).toBe('NewOrg');
  });
});

