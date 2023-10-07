import './config.mjs';

import { DynamoDB } from '@aws-sdk/client-dynamodb';

import fs from 'node:fs/promises';
import assert from 'node:assert';
import test from 'node:test';
import path from 'node:path';

import EventGenerator from './event_generator.mjs';

const {
	region,
	dynamodb_endpoint,
	follow_table_name,
	domain,
} = process.env;
/** @type {Object<string, UserInfo>} */
const users = JSON.parse(process.env.users);

const __dirname = path.dirname(process.argv[1]);

const dynamo = new DynamoDB({ region, endpoint: dynamodb_endpoint });

const tables = [{
	table_name: follow_table_name,
	schema_file: path.join(__dirname, '..', 'dynamodb', 'follows-schema.json'),
	items: [],
}];

// テスト用Dynamo DBテーブルの初期化
for (const t of tables) {
	const TableName = t.table_name;
	const schema = await fs.readFile(t.schema_file).then(buffer => JSON.parse(buffer.toString()));

	await dynamo.deleteTable({ TableName }).finally(() => { });
	await dynamo.createTable({
		...schema,
		TableName,
		ProvisionedThroughput: {
			ReadCapacityUnits: 2,
			WriteCapacityUnits: 2,
		}
	});

	for (const item of t.items) {
		await fs.readFile(item)
			.then(buffer => JSON.parse(buffer.toString()))
			.then(Item => dynamo.putItem({ Item, TableName }));
	}
}

console.debug('Prepared test tables');

const { handler } = await import('../lambda/index.mjs');

console.debug = console.error;

await test('ActivityPub', async t => {
	const user = Object.keys(users)[0];

	const g = new EventGenerator('users');
	await t.test('webfinger', async () => {
		const acct = user + '@' + domain;
		const r = await handler(g.get('/.well-known/webfinger', 'resource=' + encodeURIComponent('acct:' + acct)));
		assert.equal(r.statusCode, 200);
		assert.deepEqual(JSON.parse(r.body), {
			subject: 'acct:' + acct,
			links: [{
				rel: 'self',
				type: 'application/activity+json',
				href: 'https://' + domain + '/users/' + user + '/info'
			}],
		});
	});

	await t.test('info', async () => {
		const r = await handler(g.get(`/{id=${user}}/info`));
		assert.equal(r.statusCode, 200);
		// 簡易チェック
		assert.equal(JSON.parse(r.body).id, 'https://' + domain + '/users/' + user + '/info');
	});
});
