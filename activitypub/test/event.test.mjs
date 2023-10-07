import assert from 'node:assert';
import test from 'node:test';
import path from 'node:path';

const script_directory = path.dirname(process.argv[1]);

import dotenv from 'dotenv';
dotenv.config({ path: path.join(script_directory, '.env') });

import EventGenerator from './event_generator.mjs';
import { parse } from '../lambda/lib/gl_event_parser.mjs';

await test('EventGenerator', t => {
	const g = new EventGenerator('users');
	t.test('get', () => assert.deepEqual(parse(g.get('/users/hogehoge/info')), {
		method: 'get',
		path: '/users/hogehoge/info',
		query: '',
		keys: [],
		body: undefined,
	}));
});
