const request = require('supertest');
const express = require('express');
const eventCreationFactory = require('../endpoints/event-creation');

describe('endpoints/event-creation.js', () => {
  test('GET / returns hello world message', async () => {
    const client = { query: jest.fn() }; // not used by this simple route
    const router = eventCreationFactory(client);
    const app = express();
    app.use('/create', router);
    const res = await request(app).get('/create/');
    expect(res.status).toBe(200);
    expect(res.text).toBe('Hello world from event creation');
  });
});
