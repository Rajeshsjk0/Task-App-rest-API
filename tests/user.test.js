const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const { userOneId, userOne, setupDatabase } = require('./fixtures/db');
const User = require('../src/models/user');

beforeEach(setupDatabase);

test('Should signup a new user', async () => {
	const response = await request(app)
		.post('/users')
		.send({
			name: 'Rakesh',
			email: 'Rakesh@example.com',
			password: 'Rakesh@123',
		})
		.expect(201);

	const user = await User.findById(response.body.user._id);
	expect(user).not.toBeNull();
	expect(response.body).toMatchObject({
		user: {
			name: 'Rakesh',
			email: 'rakesh@example.com',
		},
		token: user.tokens[0].token,
	});
	expect(user.password).not.toBe('Rakesh@123');
});

test('Should login existing user', async () => {
	const response = await request(app)
		.post('/users/login')
		.send({
			email: userOne.email,
			password: userOne.password,
		})
		.expect(200);
	const user = await User.findById(response.body.user._id);
	expect(response.body.token).toBe(user.tokens[1].token);
});

test('Should not login nonexistent user', async () => {
	await request(app)
		.post('/users/login')
		.send({
			email: userOne.email,
			password: 'thisisnotmypass',
		})
		.expect(400);
});

test('Should get profile for user', async () => {
	await request(app)
		.get('/users/me')
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.send()
		.expect(200);
});

test('Should not get profile for unauthenticated user', async () => {
	await request(app).get('/users/me').send().expect(401);
});

test('Should delete account for user', async () => {
	await request(app)
		.delete('/users/me')
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.send()
		.expect(200);

	const user = await User.findById(userOneId);
	expect(user).toBeNull();
});

test('Should not delete account for unauthenticate user', async () => {
	await request(app).delete('/users/me').send().expect(401);
});

test('Should upload an avatar image', async () => {
	await request(app)
		.post('/users/me/avatar')
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.attach('avatar', 'tests/fixtures/profile-pic.jpg')
		.expect(200);
	const user = await User.findById(userOneId);
	expect(user.avatar).toStrictEqual(expect.any(Buffer));
});

test('Should update valid user fields', async () => {
	await request(app)
		.patch('/users/me')
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.send({
			name: 'Rahul',
		})
		.expect(200);
	const user = await User.findById(userOneId);
	expect(user.name).toBe('Rahul');
});

test('Should not update invalid user fields', async () => {
	await request(app)
		.patch('/users/me')
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.send({
			location: 'palakkad',
		})
		.expect(400);
	const user = await User.findById(userOneId);
	expect(user.name).toBe('Rajesh');
});

test('Should not update user if unauthenticated', async () => {
	await request(app).patch('/users/me').send({ name: 'Dexter' }).expect(401);
});

test('Should not signup user with invalid name/email/password', async () => {
	await request(app)
		.post('/users')
		.send({
			name: '',
			email: 'rsheppard83@gmail.com',
			password: 'myPass777!',
		})
		.expect(400);

	await request(app)
		.post('/users')
		.send({
			name: 'Roy',
			email: 'rsheppard83atgmail.com',
			password: 'myPass777!',
		})
		.expect(400);

	await request(app)
		.post('/users')
		.send({
			name: 'Roy',
			email: 'rsheppard83@gmail.com',
			password: 'myPassword',
		})
		.expect(400);
});

test('Should not delete user if unauthenticated', async () => {
	await request(app).delete('/users/me').send().expect(401);
});

test('Should not update user with invalid name/email/password', async () => {
	await request(app)
		.patch('/users/me')
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.send({
			name: '',
			email: 'rsheppard83@gmail.com',
			password: 'myPass777!',
		})
		.expect(400);

	await request(app)
		.patch('/users/me')
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.send({
			name: 'Roy',
			email: 'rsheppard83atgmail.com',
			password: 'myPass777!',
		})
		.expect(400);

	await request(app)
		.patch('/users/me')
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.send({
			name: 'Roy',
			email: 'rsheppard83@gmail.com',
			password: 'myPassword',
		})
		.expect(400);
});

afterAll(() => {
	mongoose.connection.close();
});
