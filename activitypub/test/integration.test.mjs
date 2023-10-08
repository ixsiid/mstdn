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
	table_follows,
	domain,
} = process.env;

/** @type {UserInfo} */
const user = JSON.parse(process.env.user_test);

const __dirname = path.dirname(process.argv[1]);

const dynamo = new DynamoDB({ region, endpoint: dynamodb_endpoint });

const tables = [{
	table_name: table_follows,
	schema_file: path.join(__dirname, '..', '..', 'dynamodb', 'follows-schema.json'),
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
	const g = new EventGenerator('users');
	await t.test('webfinger', async () => {
		const r = await handler(g.get('/.well-known/webfinger', 'resource=' + encodeURIComponent('acct:' + user.acct)));
		assert.equal(r.statusCode, 200);
		assert.deepEqual(JSON.parse(r.body), {
			subject: 'acct:' + user.acct,
			links: [{
				rel: 'self',
				type: 'application/activity+json',
				href: 'https://' + domain + '/users/' + user.preferredUsername + '/info'
			}],
		});
	});

	await t.test('info', async () => {
		const r = await handler(g.get(`/{id=${user.preferredUsername}}/info`));
		assert.equal(r.statusCode, 200);
		// 簡易チェック
		assert.equal(JSON.parse(r.body).id, 'https://' + domain + '/users/' + user.preferredUsername + '/info');
	});
});
