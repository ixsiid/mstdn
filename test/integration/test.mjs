/*
スクリプト内のベタ書きよりも、importやrequireが先に実行されるため、
環境変数の設定は、importするスクリプト内で実施する
*/
import './config.mjs';

import q from './lambda-query.mjs';
import { handler } from '../../lambda/index.mjs';

import { DynamoDB } from '@aws-sdk/client-dynamodb';

import fs from 'node:fs/promises';
import assert from 'node:assert';
import test from 'node:test';


const dynamo = new DynamoDB({ region: process.env.region, endpoint: process.env.dynamodb_endpoint });

console.debug = () => { };

const account = {
	id: 0, username: process.env.username, acct: process.env.username + "@fugafuga.hogehoge.com",
	display_name: "USER", locked: false,
	created_at: "2000-01-01T00:00:00.000Z",
	followers_count: 0, following_count: 0, statuses_count: 0,
	note: "It is my account for solo instance.",
	url: "https://fugafuga.hogehoge.com",
	avatar: "https://fugafuga.hogehoge.com/avatar.png",
	avatar_static: "https://fugafuga.hogehoge.com/avatar.gif",
	header: "https://fugafuga.hogehoge.com/header.png",
	header_static: "https://fugafuga.hogehoge.com/header.gif",
	emojis: [], fields: [], bot: false
};
const ret = [{
	emojis: [], reblogs_count: 0, visibility: "public", favourites_count: 0, media_attachments: [],
	mentions: [], spoiler_text: "", replies_count: 0, sensitive: false, content: "Hello, world!!",
	tags: [], id: 0, created_at: "1970-01-01T00:00:00.000Z",
	uri: "https://fugafuga.hogehoge.com/statuses/0",
	account,
}];

test('Integration', async t => {
	// テスト用認証情報
	let auth_context = {};

	// テスト用Dynamo DB localテーブル準備
	await dynamo.deleteTable({ TableName: process.env.dynamodb_table_name })
		.finally(() => { })
		.then(() => Promise.all([
			fs.readFile('./dynamodb/schema.json'),
			fs.readFile('./dynamodb/first-item.json'),
		]))
		.then(buffers => buffers.map(x => JSON.parse(x.toString())))
		.then(([table_schema, first_item]) => {
			return Promise.all([dynamo.createTable({
				...table_schema,
				TableName: process.env.dynamodb_table_name,
				ProvisionedThroughput: {
					ReadCapacityUnits: 2,
					WriteCapacityUnits: 2,
				}
			}), first_item]);
		})
		.then(([res, first_item]) => {
			return dynamo.putItem({
				Item: first_item,
				TableName: process.env.dynamodb_table_name,
			});
		})
		.then(res => console.log('Prepared local db, starting test ...'))
		// 非実装APIへのアクセス
		.then(() => handler(q.generate_event('/api/v1/reports', 'get')))
		.then(res => t.test('/api/v1/reports:get, It is not implemented api', () => assert.equal(res.statusCode, 501)))
		// 非認証アクセス可能
		.then(() => handler(q.generate_event('/api/v1/timelines/public', 'get')))
		.then(res => t.test('/api/v1/timelines/public:get', () => {
			assert.equal(res.statusCode, 200);
			assert.deepEqual(JSON.parse(res.body), ret);
		}))
		// 非認証アクセス不可能
		.then(() => handler(q.generate_event('/api/v1/timelines/direct', 'get')))
		.then(res => t.test('/api/v1/timelines/direct without auth', () => assert.equal(res.statusCode, 401)))
		// 認証失敗
		.then(() => handler(q.generate_authorize_event('korehatadasikunaiakusesuto-kunndesu')))
		.then(res => t.test('Authorization fail', () => assert(!res.isAuthorized)))
		// 認証成功
		.then(() => handler(q.generate_authorize_event(process.env.access_token)))
		.then(res => t.test('Authorization success', () => {
			assert(res.isAuthorized);
			auth_context = res.context;
		}))
		// 認証後のアクセス
		.then(() => handler(q.generate_event('/api/v1/timelines/direct', 'get', auth_context)))
		.then(res => t.test('/api/v1/timelines/direct with auth', () => {
			assert.equal(res.statusCode, 200);
			assert.deepEqual(JSON.parse(res.body), ret);
		}))
		// ポスト ボディがおかしいのは、受け付けない
		.then(() => handler(q.generate_event('/api/v1/statuses', 'post', auth_context, '', Buffer.from(JSON.stringify({ aaa: 'hogehoge' })))))
		.then(res => t.test('/api/v1/statuses:post with invalid body', () => assert.equal(res.statusCode, 422)))
		// ポスト 正常
		.then(() => handler(q.generate_event('/api/v1/statuses', 'post', auth_context, '', Buffer.from(JSON.stringify({ status: 'hogehoge' })))))
		.then(res => t.test('/api/v1/statuses:post with valid body', () => assert.equal(res.statusCode, 200)))
		.then(() => handler(q.generate_event('/api/v1/timelines/public', 'get')))
		.then(res => t.test('/api/v1/timelines/public:get with new post', () => {
			assert.equal(res.statusCode, 200);
			const new_post = JSON.parse(JSON.stringify(ret[0]));
			new_post.content = 'hogehoge';
			new_post.id = 1;
			new_post.uri = new_post.uri.replace(/[0-9]+$/, new_post.id);
			ret.unshift(new_post);

			// タイムスタンプはチェックしない
			const timelines = JSON.parse(res.body).map(x => ({
				...x,
				created_at: '',
			}));
			const compare = ret.map(x => ({
				...x,
				created_at: '',
			}));
			assert.deepEqual(timelines, compare);
		}))
		// アカウント取得
		/**
		 * ToDo: generate_event で path をAPIパスである /hogehoge/{id+}/fugafuga のような形に変える
		// .then(() => handler(q.generate_event('/api/v1/accounts/1', 'get')))
		// .then(res => t.test('/api/v1/accounts:get without auth', () => assert.equal(res.statusCode, 401)))
		// .then(() => handler(q.generate_event('/api/v1/accounts/1', 'get', auth_context)))
		// .then(res => t.test('/api/v1/accounts:get for not found account', () => assert.equal(res.statusCode, 404)))
		.then(() => handler(q.generate_event('/api/v1/accounts/0', 'get', auth_context)))
		.then(res => t.test('/api/v1/accounts/0/block:get', () => {
			assert.equal(res.statusCode, 200);
			assert.deepEqual(JSON.parse(res.body), account);
		}))
		*/
		// インスタンス取得
		.then(() => handler(q.generate_event('/api/v1/instance', 'get')))
		.then(res => t.test('/api/v1/instance:get', () => assert.equal(res.statusCode, 200)))
		.then(() => handler(q.generate_event('/api/v1/search', 'get')))
		.then(res => t.test('/api/v1/search:get', () => assert.equal(res.statusCode, 200)))
		.then(() => handler(q.generate_event('/api/v2/search', 'get')))
		.then(res => t.test('/api/v2/search:get', () => assert.equal(res.statusCode, 200)))
		.catch(err => {
			console.error(err);
			throw err;
		})
});