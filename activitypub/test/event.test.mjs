import assert from 'node:assert';
import test from 'node:test';
import path from 'node:path';

const script_directory = path.dirname(process.argv[1]);

import dotenv from 'dotenv';
dotenv.config({ path: path.join(script_directory, '.env') });

import EventGenerator from './event_generator.mjs';
import { parse } from '../lambda/lib/gl_event_parser.mjs';
import exp from 'node:constants';

await test('EventGenerator', async t => {
	const g = new EventGenerator('users');
	await t.test('get', () => assert.deepEqual(parse(g.get('/users/hogehoge/info')), {
		method: 'get',
		path: '/users/hogehoge/info',
		query: null,
		keys: [],
		body: undefined,
	}));

	await t.test('get with query', () => assert.deepEqual(parse(g.get('/users/hogehoge/info', 'resource=acct:hogehoge@fugafuga.com')), {
		method: 'get',
		path: '/users/hogehoge/info',
		query: {
			resource: 'acct:hogehoge@fugafuga.com',
		},
		keys: [],
		body: undefined,
	}));

	await t.test('get with path parameter', () => {
		const expected_keys = ['hoge'];
		expected_keys.id = 'hoge';
		assert.deepEqual(parse(g.get('/users/{id=hoge}/info', 'user=hoge&id=fuga&name=piyo')), {
			method: 'get',
			path: '/users/info',
			query: {
				user: 'hoge',
				id: 'fuga',
				name: 'piyo',
			},
			keys: expected_keys,
			body: undefined,
		})
	});

	await t.test('post', () => assert.deepEqual(parse(g.post('/users/hogehoge/info', '', null, Buffer.from(JSON.stringify({ hoge: 'fuga' })))), {
		method: 'post',
		path: '/users/hogehoge/info',
		query: null,
		keys: [],
		body: {
			hoge: 'fuga',
		},
	}));
});
