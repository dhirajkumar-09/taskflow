const request = require('supertest');
const app = require('../app');

const testUser = {
  name: 'Test User',
  email: 'testuser@example.com',
  password: 'password123'
};

describe('Auth: signup', () => {
  it('signs up a new user successfully', async () => {
    const res = await request(app).post('/api/auth/signup').send(testUser);
    expect(res.statusCode).toBe(201);
  });

  it('rejects signup with an invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ ...testUser, email: 'not-an-email' });
    expect(res.statusCode).toBe(400);
  });

  it('rejects signup with a password shorter than 6 characters', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ ...testUser, password: '123' });
    expect(res.statusCode).toBe(400);
  });

  it('rejects signup with a duplicate email', async () => {
    await request(app).post('/api/auth/signup').send(testUser);
    const res = await request(app).post('/api/auth/signup').send(testUser);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/already exists/i);
  });
});

describe('Auth: login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/signup').send(testUser);
  });

  it('logs in with correct credentials and returns a token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('rejects login with the wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'wrongpassword' });
    expect(res.statusCode).toBe(400);
  });

  it('rejects login for a non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: testUser.password });
    expect(res.statusCode).toBe(400);
  });
});

describe('Auth: protected route', () => {
  it('blocks access without a token', async () => {
    const res = await request(app).get('/api/protected');
    expect(res.statusCode).toBe(401);
  });

  it('allows access with a valid token', async () => {
    await request(app).post('/api/auth/signup').send(testUser);
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    const res = await request(app)
      .get('/api/protected')
      .set('Authorization', `Bearer ${loginRes.body.token}`);
    expect(res.statusCode).toBe(200);
  });
});
