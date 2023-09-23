import assert from 'node:assert';
import test from 'node:test';

import parse_path from "../lambda/lib/parse_path.mjs"

const d = [{
	routeKey: 'PUT /v1/media/{id}',
	rawPath: '/api/v1/media/b221f593-c904-4426-b7d3-e9011f3e8169',
	expect: {
		path: '/v1/media',
		keys: ['b221f593-c904-4426-b7d3-e9011f3e8169'],
		method: 'put',
	},
}, {
	routeKey: 'POST /v1/media/{id+}',
	rawPath: '/api/v1/media/b221f593-c904-4426-b7d3-e9011f3e8169/hogehoge',
	expect: {
		path: '/v1/media',
		keys: ['b221f593-c904-4426-b7d3-e9011f3e8169', 'hogehoge'],
		method: 'post',
	},
}, {
	routeKey: 'DELETE /v1/media/{id}/delete',
	rawPath: '/api/v1/media/b221f593-c904-4426-b7d3-e9011f3e8169/delete',
	expect: {
		path: '/v1/media/delete',
		keys: ['b221f593-c904-4426-b7d3-e9011f3e8169'],
		method: 'delete',
	},
}, {
	routeKey: 'GET /v1/media/{id}/hogehoge/{fugafuga}/piyopiyo',
	rawPath: '/api/v1/media/b221f593-c904-4426-b7d3-e9011f3e8169/hogehoge/aaaaaa/piyopiyo',
	expect: {
		path: '/v1/media/hogehoge/piyopiyo',
		keys: ['b221f593-c904-4426-b7d3-e9011f3e8169', 'aaaaaa'],
		method: 'get',
	},
}];


// await Promise.all(d.map(x => t.test(x.rawPath, assert.deepEqual(parse_path(x), x.expect))));
for (const x of d) {
	test('Parse path', async t => {
		await t.test(x.rawPath, assert.deepEqual(parse_path(x), x.expect));
	});
}