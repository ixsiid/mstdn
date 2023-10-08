/*
スクリプト内のベタ書きよりも、importやrequireが先に実行されるため、
環境変数の設定は、importするスクリプト内で実施する
*/
import './config.mjs';

import path from 'node:path';
const script_directory = path.dirname(process.argv[1]);

import q from './lambda-query.mjs';
import { handler } from '../../lambda/index.mjs';

import { DynamoDB } from '@aws-sdk/client-dynamodb';

import fs from 'node:fs/promises';
import assert from 'node:assert';
import test from 'node:test';

const dynamo = new DynamoDB({ region: process.env.region, endpoint: process.env.dynamodb_endpoint });

/** @type {UserInfo} */
const user = JSON.parse(process.env.user_test);

const server_key = process.env.vapid_public_key;

console.debug = () => { };

const table_statuses = process.env.instance + '-statuses';
const table_subscriptions = process.env.instance + '-subscriptions';

const account = {
	id: 0, username: user.preferredUsername, acct: user.acct,
	display_name: user.name, locked: false,
	created_at: "2000-01-01T00:00:00.000Z",
	followers_count: 0, following_count: 0, statuses_count: 0,
	note: user.summary,
	url: "https://fugafuga.hogehoge.com",
	avatar: "https://fugafuga.hogehoge.com/avatar/icon.png",
	avatar_static: "https://fugafuga.hogehoge.com/avatar/icon.gif",
	header: "https://fugafuga.hogehoge.com/avatar/header.png",
	header_static: "https://fugafuga.hogehoge.com/avatar/header.gif",
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

	// テスト用Dynamo DB localテーブル準備。初回テスト時はテーブルがないため、例外を無視する
	await Promise.all(
		[table_statuses, table_subscriptions]
			.map(TableName => dynamo.deleteTable({ TableName }))
	).catch(() => { }).finally(() => { });

	// statusesテーブル作成
	await Promise.all([
		fs.readFile(path.join(script_directory, '..', '..', '..', 'dynamodb', 'schema.json')),
		fs.readFile(path.join(script_directory, '..', '..', '..', 'dynamodb', 'first-item.json')),
	])
		.then(buffers => buffers.map(x => JSON.parse(x.toString())))
		.then(([table_schema, first_item]) => {
			return dynamo.createTable({
				...table_schema,
				TableName: table_statuses,
				ProvisionedThroughput: {
					ReadCapacityUnits: 2,
					WriteCapacityUnits: 2,
				}
			}).then(res => dynamo.putItem({
				Item: first_item,
				TableName: table_statuses,
			}));
		})
		.then(res => console.log('Prepared statuses tables'));

	// subscriptionsテーブル作成
	await fs.readFile(path.join(script_directory, '..', '..', '..', 'dynamodb', 'subscriptions-schema.json'))
		.then(buffer => JSON.parse(buffer.toString()))
		.then(table_schema => dynamo.createTable({
			...table_schema,
			TableName: table_subscriptions,
			ProvisionedThroughput: {
				ReadCapacityUnits: 2,
				WriteCapacityUnits: 2,
			}
		}))
		.then(res => console.log('Prepared subscriptions table'));

	let new_id = -1;

	await (async () => { console.log('starting test') })()
		// 非実装APIへのアクセス
		.then(() => handler(q.generate_event('/v1/reports', 'get')))
		.then(res => t.test('/v1/reports:get, It is not implemented api', () => assert.equal(res.statusCode, 501)))
		// 非認証アクセス可能
		.then(() => handler(q.generate_event('/v1/timelines/public', 'get')))
		.then(res => t.test('/v1/timelines/public:get', () => {
			assert.equal(res.statusCode, 200);
			assert.deepEqual(JSON.parse(res.body), ret);
		}))
		// 非認証アクセス不可能
		.then(() => handler(q.generate_event('/v1/timelines/direct', 'get')))
		.then(res => t.test('/v1/timelines/direct without auth', () => assert.equal(res.statusCode, 401)))
		// 認証データ作成
		.then(() => {
			auth_context = {
				jwt: {
					claims: {
						username: "12345678-90ab-cdef-ghij-klmnopqrstuv",
					},
					scopes: null,
				}
			}
		})
		// 認証後のアクセス
		.then(() => handler(q.generate_event('/v1/timelines/direct', 'get', auth_context)))
		.then(res => t.test('/v1/timelines/direct with auth', () => {
			assert.equal(res.statusCode, 200);
			assert.deepEqual(JSON.parse(res.body), ret);
		}))
		// ポスト ボディがおかしいのは、受け付けない
		.then(() => handler(q.generate_event('/v1/statuses', 'post', auth_context, '', Buffer.from(JSON.stringify({ aaa: 'hogehoge' })))))
		.then(res => t.test('/v1/statuses:post with invalid body', () => assert.equal(res.statusCode, 422)))
		// ポスト 正常
		.then(() => handler(q.generate_event('/v1/statuses', 'post', auth_context, '', Buffer.from(JSON.stringify({ status: 'hogehoge' })))))
		.then(res => t.test('/v1/statuses:post with valid body', () => assert.equal(res.statusCode, 200)))
		.then(() => handler(q.generate_event('/v1/timelines/public', 'get')))
		.then(res => t.test('/v1/timelines/public:get with new post', () => {
			assert.equal(res.statusCode, 200);

			new_id = JSON.parse(res.body)[0].id;
			const new_post = JSON.parse(JSON.stringify(ret[0]));
			new_post.content = 'hogehoge';
			new_post.id = new_id;
			new_post.uri = new_post.uri.replace(/[0-9]+$/, new_id);
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
		// ファボ
		.then(() => handler(q.generate_event(`/v1/statuses/{id=${new_id}}/favourite`, 'post', auth_context)))
		.then(res => t.test(`/v1/statuses/${new_id}/favourite:post`, () => {
			assert.equal(res.statusCode, 200);
			const body = JSON.parse(res.body);
			assert.equal(body.id, new_id);
			assert.equal(body.favourited, true);
		}))
		// アカウント取得
		.then(() => handler(q.generate_event('/v1/accounts/{id+=1}', 'get')))
		.then(res => t.test('/v1/accounts/1:get without auth', () => assert.equal(res.statusCode, 401)))
		.then(() => handler(q.generate_event('/v1/accounts/{id+=1}', 'get', auth_context)))
		.then(res => t.test('/v1/accounts/1:get for not found account', () => assert.equal(res.statusCode, 404)))
		.then(() => handler(q.generate_event('/v1/accounts/{id+=0}', 'get', auth_context)))
		.then(res => t.test('/v1/accounts/0:get', () => {
			assert.equal(res.statusCode, 200);
			assert.deepEqual(JSON.parse(res.body), account);
		}))
		// インスタンス取得
		.then(() => handler(q.generate_event('/v2/search', 'get')))
		.then(res => t.test('/v2/search:get', () => assert.equal(res.statusCode, 200)))
		// メディア
		// Postデータ、Putデータを用意する
		// .then(() => handler(q.generate_event('/v1/media', 'post', auth_context, '', Buffer.from())))
		// .then(() => handler(q.generate_event('/v1/media/${id}', 'put', auth_context, '', Buffer.from())))
		// Subscription
		// 最初は登録がない
		.then(() => {
			const subscription_body = {
				data: {
					alerts: {
						favourite: true,
						follow: true,
						mention: true,
						poll: true,
						reblog: true
					}
				},
				policy: 'all',
				subscription: {
					endpoint: 'https://hogehoge.com/fugafuga',
					keys: {
						auth: 'AUTH_KEY',
						p256dh: 'PRIVATE KEY',
					}
				}
			};

			return (async () => { })()
				.then(() => handler(q.generate_event('/v1/push/subscription', 'get', auth_context)))
				.then(res => t.test('/v1/push/subscription:get', () => assert.equal(res.statusCode, 404)))
				.then(() => handler(q.generate_event('/v1/push/subscription', 'post', auth_context, '', Buffer.from(JSON.stringify(subscription_body)))))
				.then(res => t.test('/v1/push/subscription:post', () => {
					assert.equal(res.statusCode, 200);
					assert.deepEqual(JSON.parse(res.body), {
						id: 0,
						endpoint: subscription_body.subscription.endpoint,
						alerts: subscription_body.data.alerts,
						server_key,
					});
				}))
				.then(() => handler(q.generate_event('/v1/push/subscription', 'get', auth_context)))
				.then(res => t.test('/v1/push/subscription:get', () => {
					assert.equal(res.statusCode, 200);
					assert.deepEqual(JSON.parse(res.body), {
						id: 0,
						endpoint: subscription_body.subscription.endpoint,
						alerts: subscription_body.data.alerts,
						server_key,
					});
				}))
		})
		// Not implements: post -> get
		.catch(err => {
			console.error(err);
			throw err;
		});

	// method === get, statusCode === 200だけチェック
	await Promise.all(
		[
			'instance',
			'search',
			'suggestions',
			'notifications',
			'follows',
			'filters',
			'favourites',
			'endorsements',
			'domain_blocks',
			'custom_emojis',
			'blocks',
			'accounts/verify_credentials',
			'accounts/search',
			'accounts/relationships',
		]
			.map(x => '/v1/' + x)
			.map(p => handler(q.generate_event(p, 'get'))
				.then(res => t.test(p + ':get', () => assert.equal(res.statusCode, 200))))
	);

	// method === get, statusCode === 401だけチェック
	await Promise.all(
		[
			'accounts/update_credentials',
		]
			.map(x => '/v1/' + x)
			.map(p => handler(q.generate_event(p, 'get'))
				.then(res => t.test(p + ':get', () => assert.equal(res.statusCode, 401))))
	);
});