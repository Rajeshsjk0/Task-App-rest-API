const request = require('supertest');
const app = require('../src/app');
const Task = require('../src/models/task');
const mongoose = require('mongoose');
const {
	userOneId,
	userOne,
	userTwoId,
	userTwo,
	taskOne,
	taskTwo,
	taskThree,
	setupDatabase,
} = require('./fixtures/db');

beforeEach(setupDatabase);

test('Should create task for user', async () => {
	const response = await request(app)
		.post('/tasks')
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.send({
			description: 'Complete the course 2',
		})
		.expect(201);
	const task = await Task.findById(response.body._id);
	expect(task).not.toBeNull();
	expect(task.completed).toEqual(false);
});

test('Should not create task with invalid description/completed', async () => {
	await request(app)
		.post('/tasks')
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.send({
			meassge: 'Complete the course 2',
		})
		.expect(400);
});

test('Should read tasks from a user', async () => {
	const response = await request(app)
		.get('/tasks')
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.send()
		.expect(200);
	expect(response.body.length).toBe(2);
});

test('Should fetch only completed tasks', async () => {
	const response = await request(app)
		.get('/tasks?completed=true')
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.send()
		.expect(200);

	expect(response.body.length).toBe(1);
});

test('Should fetch only completed tasks', async () => {
	const response = await request(app)
		.get('/tasks?completed=false')
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.send()
		.expect(200);

	expect(response.body.length).toBe(1);
});

test('Should fetch user task by id', async () => {
	const response = await request(app)
		.get(`/tasks/${taskOne._id}`)
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.send()
		.expect(200);
	const task = await Task.findById(taskOne._id);
	expect(task.description).toBe('First task');
});

test('Should not fetch user task by id if unauthenticated', async () => {
	const response = await request(app)
		.get(`/tasks/${taskOne._id}`)
		.set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
		.send()
		.expect(404);
});

test('Should not fetch other users task by id', async () => {
	const response = await request(app)
		.get(`/tasks/123456`)
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.send()
		.expect(500);
});

test('Should update particular task from a user', async () => {
	const response = await request(app)
		.patch(`/tasks/${taskOne._id}`)
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.send({
			completed: true,
		})
		.expect(200);
	const task = await Task.findById(taskOne._id);
	expect(task.completed).toBe(true);
});

test(' Should not update task with invalid description/completed', async () => {
	const response = await request(app)
		.patch(`/tasks/${taskOne._id}`)
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.send({
			compl: true,
		})
		.expect(400);
	const task = await Task.findById(taskOne._id);
	expect(task.completed).toBe(false);
});

test('Should not update other users task', async () => {
	const response = await request(app)
		.patch(`/tasks/${taskOne._id}`)
		.set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
		.send({
			completed: true,
		})
		.expect(404);
	const task = await Task.findById(taskOne._id);
	expect(task.completed).toBe(false);
});

test('Should delete particular task from a user', async () => {
	const response = await request(app)
		.delete(`/tasks/${taskOne._id}`)
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.send()
		.expect(200);
	const task = await Task.findById(taskOne._id);
	expect(task).toBeNull();
});

test('Should not delete task if unauthenticated', async () => {
	const response = await request(app)
		.delete(`/tasks/${taskThree._id}`)
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.send()
		.expect(404);
});

test('Should sort tasks by description/completed/createdAt/updatedAt', async () => {
	const { body: tasksByDescription } = await request(app)
		.get('/tasks?sortBy=description_desc')
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.send()
		.expect(200);

	expect(tasksByDescription[0]._id.toString()).toBe(taskOne._id.toString());

	const { body: tasksByCompleted } = await request(app)
		.get('/tasks?sortBy=completed_desc')
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.send()
		.expect(200);

	expect(tasksByCompleted[0]._id.toString()).toBe(taskOne._id.toString());

	const { body: tasksByCreatedAt } = await request(app)
		.get('/tasks?sortBy=createdAt_desc')
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.send()
		.expect(200);

	expect(tasksByCreatedAt[0]._id.toString()).toBe(taskOne._id.toString());

	await Task.findByIdAndUpdate(taskOne._id, { completed: true });
	const { body: tasksByUpdatedAt } = await request(app)
		.get('/tasks?sortBy=updatedAt_desc')
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.send()
		.expect(200);

	expect(tasksByUpdatedAt[0]._id.toString()).toBe(taskOne._id.toString());
});

test('Should fetch page of tasks', async () => {
	const { body: tasks } = await request(app)
		.get('/tasks?skip=0&limit=1')
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.send()
		.expect(200);

	expect(tasks.length).toBe(1);
});

afterAll(() => {
	mongoose.connection.close();
});
