import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import '../../test/setupDb.js';
import { createApp } from '../../app.js';
import { CommunityPost } from './communityPost.model.js';
import { CommunityReply } from './communityReply.model.js';
import { Notification } from '../notifications/notification.model.js';

describe('Community & Senior Network Integration Tests', () => {
  const app = createApp();
  let studentToken;
  let seniorToken;

  beforeEach(async () => {
    // Register junior student
    const studRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `junior_${Date.now()}_${Math.random().toString(36).substring(7)}@test.com`,
        password: 'Password123',
        name: 'Junior Undergrad',
        role: 'student',
      });
    studentToken = studRes.body.data.accessToken;

    // Register senior / alumni mentor
    const senRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `alumni_${Date.now()}_${Math.random().toString(36).substring(7)}@test.com`,
        password: 'Password123',
        name: 'Alumni SDE-2',
        role: 'senior',
      });
    seniorToken = senRes.body.data.accessToken;
  });

  it('creates and lists forum posts with Ask a Senior flag', async () => {
    const createRes = await request(app)
      .post('/api/v1/community')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'How to prepare for distributed systems rounds at top tech firms?',
        content: 'Looking for advice on consensus protocols, partitioning, and caching patterns.',
        category: 'career',
        tags: ['Distributed Systems', 'Interview Prep'],
        isAskSenior: true,
      })
      .expect(201);

    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.title).toContain('distributed systems');
    expect(createRes.body.data.isAskSenior).toBe(true);
    expect(createRes.body.data.authorId.name).toBe('Junior Undergrad');

    // List with isAskSenior filter
    const listRes = await request(app).get('/api/v1/community?isAskSenior=true').expect(200);

    expect(listRes.body.success).toBe(true);
    expect(listRes.body.data.length).toBeGreaterThan(0);
    expect(listRes.body.data[0].isAskSenior).toBe(true);
  });

  it('allows alumni/senior to reply to post, storing in segregated replies collection and notifying author', async () => {
    // 1. Student creates post
    const postRes = await request(app)
      .post('/api/v1/community')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Understanding Raft Leader Election',
        content: 'What happens during split vote scenarios?',
        category: 'academics',
      });
    const postId = postRes.body.data._id;

    // 2. Senior adds reply
    const replyRes = await request(app)
      .post(`/api/v1/community/${postId}/replies`)
      .set('Authorization', `Bearer ${seniorToken}`)
      .send({
        content:
          'Raft uses randomized election timeouts (e.g. 150-300ms) to rapidly break split-vote deadlocks.',
      })
      .expect(201);

    expect(replyRes.body.success).toBe(true);
    expect(replyRes.body.data.postId).toBe(postId);
    expect(replyRes.body.data.authorId.role).toBe('senior');

    // 3. Verify reply exists in segregated collection
    const replyDoc = await CommunityReply.findOne({ postId });
    expect(replyDoc).toBeDefined();

    // 4. Verify original student received an in-app notification
    const studentUser = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${studentToken}`);
    const notifs = await Notification.find({ userId: studentUser.body.data._id });
    expect(notifs.length).toBeGreaterThan(0);
    expect(notifs[0].title).toContain('New Reply');
  });

  it('supports upvoting posts and marking accepted solutions by post author', async () => {
    // Student creates post
    const postRes = await request(app)
      .post('/api/v1/community')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Binary Tree Diameter Definition',
        content: 'Is diameter measured by edges or nodes in standard definitions?',
        category: 'academics',
      });
    const postId = postRes.body.data._id;

    // Senior adds reply
    const replyRes = await request(app)
      .post(`/api/v1/community/${postId}/replies`)
      .set('Authorization', `Bearer ${seniorToken}`)
      .send({
        content:
          'In LeetCode and most standard competitive programming, diameter is number of edges along longest path.',
      });
    const replyId = replyRes.body.data._id;

    // Senior upvotes the post
    const upvoteRes = await request(app)
      .post(`/api/v1/community/${postId}/upvote`)
      .set('Authorization', `Bearer ${seniorToken}`)
      .expect(200);

    expect(upvoteRes.body.data.upvoteCount).toBe(1);
    expect(upvoteRes.body.data.hasUpvoted).toBe(true);

    // Student marks reply as accepted solution
    const acceptRes = await request(app)
      .post(`/api/v1/community/${postId}/replies/${replyId}/accept`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(acceptRes.body.data.isResolved).toBe(true);
    expect(acceptRes.body.data.acceptedReplyId).toBe(replyId);

    const postDoc = await CommunityPost.findById(postId);
    expect(postDoc.isResolved).toBe(true);
  });
});
