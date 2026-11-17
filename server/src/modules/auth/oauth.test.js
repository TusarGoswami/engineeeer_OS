import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import '../../test/setupDb.js';
import { createApp } from '../../app.js';
import { User } from '../users/user.model.js';

describe('OAuth Authentication Endpoints', () => {
  let app;

  beforeEach(async () => {
    app = createApp();
    await User.deleteMany({ email: { $in: ['alex.engineer@gmail.com', 'tusar.dev@github.com'] } });
  });

  it('exchanges Google code and creates/authenticates user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/oauth/google')
      .send({ code: 'demo_google_code', redirectUri: 'http://localhost:3000/auth/callback' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('alex.engineer@gmail.com');
    expect(res.body.data.user.oauthProvider).toBe('google');
    expect(res.body.data.accessToken).toBeDefined();

    const dbUser = await User.findOne({ email: 'alex.engineer@gmail.com' });
    expect(dbUser).not.toBeNull();
    expect(dbUser.oauthProvider).toBe('google');
  });

  it('exchanges GitHub code, creates user and automatically links GitHub handle', async () => {
    const res = await request(app)
      .post('/api/v1/auth/oauth/github')
      .send({ code: 'demo_github_code', redirectUri: 'http://localhost:3000/auth/callback' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('tusar.dev@github.com');
    expect(res.body.data.user.oauthProvider).toBe('github');
    expect(res.body.data.user.profile.githubHandle).toBe('tusargoswami');
    expect(res.body.data.accessToken).toBeDefined();

    const dbUser = await User.findOne({ email: 'tusar.dev@github.com' });
    expect(dbUser).not.toBeNull();
    expect(dbUser.profile.githubHandle).toBe('tusargoswami');
  });
});
