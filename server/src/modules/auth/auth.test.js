import { describe, it, expect } from 'vitest';
import request from 'supertest';
import '../../test/setupDb.js';
import { createApp } from '../../app.js';
import { PasswordService } from './password.service.js';

describe('Auth & User Services Integration Tests', () => {
  const app = createApp();

  describe('PasswordService', () => {
    it('hashes and securely verifies valid passwords', async () => {
      const raw = 'SecurePassword123!';
      const hash = await PasswordService.hash(raw);
      expect(hash).toBeDefined();
      expect(hash).not.toBe(raw);

      const isValid = await PasswordService.verify(raw, hash);
      expect(isValid).toBe(true);

      const isInvalid = await PasswordService.verify('WrongPassword', hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe('POST /api/v1/auth/register', () => {
    it('successfully registers a student user and returns access token', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'student@mit.edu',
        password: 'Password123',
        name: 'Jane Doe',
        university: 'MIT',
        branch: 'Computer Science',
        semester: 5,
      });

      expect(res.status).toBe(201);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe('student@mit.edu');
      expect(res.body.data.user.role).toBe('student');
      expect(res.body.data.user.passwordHash).toBeUndefined(); // ensure never leaked
      expect(res.body.data.accessToken).toBeDefined();

      // Check refresh token cookie
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some(c => c.includes('refreshToken='))).toBe(true);
    });

    it('rejects duplicate email with 409 Conflict', async () => {
      await request(app).post('/api/v1/auth/register').send({
        email: 'duplicate@mit.edu',
        password: 'Password123',
        name: 'Jane Doe',
      });

      const duplicateRes = await request(app).post('/api/v1/auth/register').send({
        email: 'duplicate@mit.edu',
        password: 'Password123',
        name: 'Jane Doe 2',
      });

      expect(duplicateRes.status).toBe(409);
      expect(duplicateRes.body.error.code).toBe('CONFLICT');
    });

    it('rejects invalid email and weak password with 422 Validation Error', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'not-an-email',
        password: 'weak',
        name: 'J',
      });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(Array.isArray(res.body.error.details)).toBe(true);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('successfully authenticates with correct credentials', async () => {
      await request(app).post('/api/v1/auth/register').send({
        email: 'login@test.com',
        password: 'Password123',
        name: 'Login Tester',
      });

      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'login@test.com',
        password: 'Password123',
      });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe('login@test.com');
    });

    it('returns 401 Unauthorized for incorrect password', async () => {
      await request(app).post('/api/v1/auth/register').send({
        email: 'badpass@test.com',
        password: 'Password123',
        name: 'Tester',
      });

      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'badpass@test.com',
        password: 'IncorrectPassword999',
      });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Token Refresh and Reuse Detection', () => {
    it('rotates refresh token and detects reuse attempt', async () => {
      const regRes = await request(app).post('/api/v1/auth/register').send({
        email: 'rotation@test.com',
        password: 'Password123',
        name: 'Rotation Tester',
      });

      const cookieHeader = regRes.headers['set-cookie'][0];
      const initialRefreshToken = cookieHeader.split(';')[0].replace('refreshToken=', '');

      // First valid refresh
      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', `refreshToken=${initialRefreshToken}`);

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.data.accessToken).toBeDefined();

      const newCookieHeader = refreshRes.headers['set-cookie'][0];
      const nextRefreshToken = newCookieHeader.split(';')[0].replace('refreshToken=', '');
      expect(nextRefreshToken).not.toBe(initialRefreshToken);

      // Replay attack: Attacker attempts to use initialRefreshToken again
      const replayRes = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', `refreshToken=${initialRefreshToken}`);

      expect(replayRes.status).toBe(401);
      expect(replayRes.body.error.message).toContain('Token reuse detected');

      // The new valid token should now ALSO be revoked due to family invalidation
      const subsequentRes = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', `refreshToken=${nextRefreshToken}`);

      expect(subsequentRes.status).toBe(401);
    });
  });

  describe('User Profile & RBAC', () => {
    it('retrieves and updates user profile via /api/v1/users/me', async () => {
      const reg = await request(app).post('/api/v1/auth/register').send({
        email: 'profile@test.com',
        password: 'Password123',
        name: 'Profile Tester',
        university: 'Stanford',
        semester: 3,
      });

      const token = reg.body.data.accessToken;

      // GET /api/v1/users/me
      const getMe = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(getMe.status).toBe(200);
      expect(getMe.body.data.name).toBe('Profile Tester');
      expect(getMe.body.data.university).toBe('Stanford');

      // PATCH /api/v1/users/me
      const updateMe = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({
          semester: 4,
          bio: 'Building operating systems and solving LeetCode daily.',
          goals: ['Master Graph Algorithms', 'Target Google / Meta'],
        });

      expect(updateMe.status).toBe(200);
      expect(updateMe.body.data.semester).toBe(4);
      expect(updateMe.body.data.bio).toContain('Building operating systems');
      expect(updateMe.body.data.goals).toHaveLength(2);
    });

    it('blocks unauthenticated requests to protected endpoints', async () => {
      const res = await request(app).get('/api/v1/users/me');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});
