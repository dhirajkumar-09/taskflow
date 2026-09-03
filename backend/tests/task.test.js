const request = require('supertest');
const app = require('../app');

const leader = { name: 'Leader', email: 'leader@example.com', password: 'password123' };
const outsider = { name: 'Outsider', email: 'outsider@example.com', password: 'password123' };

// Helper: signs a user up, logs them in, and returns their JWT token.
const registerAndLogin = async (user) => {
  await request(app).post('/api/auth/signup').send(user);
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: user.email, password: user.password });
  return res.body.token;
};

describe('Task CRUD', () => {
  let leaderToken;
  let outsiderToken;
  let boardId;

  beforeEach(async () => {
    leaderToken = await registerAndLogin(leader);
    outsiderToken = await registerAndLogin(outsider);

    const boardRes = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({ name: 'Test Board' });
    boardId = boardRes.body.board._id;
  });

  it('creates a task on a board the user owns', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({ title: 'Write tests', boardId });

    expect(res.statusCode).toBe(201);
    expect(res.body.task.title).toBe('Write tests');
    expect(res.body.task.status).toBe('todo');
  });

  it('rejects task creation without a title', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({ boardId });
    expect(res.statusCode).toBe(400);
  });

  it('blocks a user with no access to the board from creating a task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${outsiderToken}`)
      .send({ title: 'Sneaky task', boardId });
    expect(res.statusCode).toBe(403);
  });

  it('lists tasks for a board the user has access to', async () => {
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({ title: 'Task 1', boardId });

    const res = await request(app)
      .get(`/api/tasks/${boardId}`)
      .set('Authorization', `Bearer ${leaderToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
  });

  it('updates progress and derives the correct status', async () => {
    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({ title: 'Task to update', boardId });
    const taskId = createRes.body.task._id;

    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({ progress: 60 });

    expect(res.statusCode).toBe(200);
    expect(res.body.task.status).toBe('in-progress');
  });

  it('deletes a task', async () => {
    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({ title: 'Task to delete', boardId });
    const taskId = createRes.body.task._id;

    const deleteRes = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${leaderToken}`);
    expect(deleteRes.statusCode).toBe(200);

    const listRes = await request(app)
      .get(`/api/tasks/${boardId}`)
      .set('Authorization', `Bearer ${leaderToken}`);
    expect(listRes.body.length).toBe(0);
  });

  it('rejects all task routes without a token', async () => {
    const res = await request(app).get(`/api/tasks/${boardId}`);
    expect(res.statusCode).toBe(401);
  });
});
