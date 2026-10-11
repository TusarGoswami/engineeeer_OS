import { describe, it, expect } from 'vitest';
import request from 'supertest';
import './test/setupDb.js';
import { createApp } from './app.js';

describe('App Health Endpoints', () => {
  const app = createApp();

  it('GET /healthz returns 200 and ok status', async () => {
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('engineeros-api');
  });

  it('GET /readyz returns 200 and ready status', async () => {
    const res = await request(app).get('/readyz');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ready');
  });

  it('GET /api/v1 returns API root metadata', async () => {
    const res = await request(app).get('/api/v1');
    expect(res.status).toBe(200);
    expect(res.body.version).toBe('1.0.0');
    expect(res.body.status).toBe('active');
  });
});
