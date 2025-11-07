const request = require('supertest');
const express = require('express');
const loginFactory = require('../endpoints/login');

describe('endpoints/login.js', () => {
  test('POST / organizer success', async () => {
    const mockClient = { query: jest.fn()
      .mockResolvedValueOnce({ rows: [{ organizerID: 1, organizerUserName: 'org', organizerPassword: 'pw' }] })
      .mockResolvedValueOnce({ rows: [] }) // second call not reached
    };
    const app = express();
    app.use(express.json());
    app.use('/login', loginFactory(mockClient));
    const res = await request(app).post('/login/').send({ username: 'org', password: 'pw' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/organizer/);
  });

  test('POST / student success after organizer miss', async () => {
    const mockClient = { query: jest.fn()
      .mockResolvedValueOnce({ rows: [] }) // organizer query no match
      .mockResolvedValueOnce({ rows: [{ studentID: 2, studentUserName: 'stud', studentPassword: 'pw' }] }) // student query match
    };
    const app = express();
    app.use(express.json());
    app.use('/login', loginFactory(mockClient));
    const res = await request(app).post('/login/').send({ username: 'stud', password: 'pw' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/student/);
  });

  test('POST / no user returns message', async () => {
    const mockClient = { query: jest.fn()
      .mockResolvedValueOnce({ rows: [] }) // organizer query
      .mockResolvedValueOnce({ rows: [] }) // student query
    };
    const app = express();
    app.use(express.json());
    app.use('/login', loginFactory(mockClient));
    const res = await request(app).post('/login/').send({ username: 'x', password: 'y' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/No users/);
  });

  test('POST / missing fields returns 400', async () => {
    const mockClient = { query: jest.fn() };
    const app = express();
    app.use(express.json());
    app.use('/login', loginFactory(mockClient));
    const res = await request(app).post('/login/').send({ username: 'only' });
    expect(res.status).toBe(400);
  });
});
