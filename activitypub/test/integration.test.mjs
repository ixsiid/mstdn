import './config.mjs';

import { DynamoDB } from '@aws-sdk/client-dynamodb';

import fs from 'node:fs/promises';
import assert from 'node:assert';
import test from 'node:test';
import path from 'node:path';

const __dirname = path.dirname(process.argv[1]);

const dynamo = new DynamoDB({ region: process.env.region, endpoint: process.env.dynamodb_endpoint });

const tables = [{
	table_name: process.env.follow_table_name,
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

const { handler } = import('../lambda/index.mjs');

