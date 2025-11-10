const request = require('supertest');
const express = require('express');

function makeClient(rows) {
  return { query: jest.fn().mockResolvedValue({ rows }) };
}

const discountFeatureFactory = require('../endpoints/discountFeature');

function buildApp(client) {
  const app = express();
  app.use('/events', discountFeatureFactory(client));
  return app;
}

describe('endpoints/discountFeature.js', () => {
  test('returns filtered discounts with proper percentage', async () => {
    const now = Date.now();
    const rows = [
      { eventID: 1, eventName: 'Soon', startTime: new Date(now + 12*3600*1000).toISOString(), maxParticipants: 100, currentParticipants: 10, eventPrices: 40 },
      { eventID: 2, eventName: 'Tomorrow+', startTime: new Date(now + 36*3600*1000).toISOString(), maxParticipants: 50, currentParticipants: 0, eventPrices: 20 },
      { eventID: 3, eventName: 'Far', startTime: new Date(now + 10*24*3600*1000).toISOString(), maxParticipants: 30, currentParticipants: 0, eventPrices: 10 }
    ];
    const client = makeClient(rows);
    const app = buildApp(client);
    const res = await request(app).get('/events/discounts');
    expect(res.status).toBe(200);
    // Should only include first two within window (default 2 days)
    expect(res.body.data.length).toBe(2);
    const soon = res.body.data.find(d => d.eventID === 1);
    const tomorrow = res.body.data.find(d => d.eventID === 2);
    expect(soon.discountPercent).toBe(50);
    expect(tomorrow.discountPercent).toBe(25);
  });
});

