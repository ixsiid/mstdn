import assert from 'node:assert';
import test from 'node:test';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const script_directory = path.dirname(process.argv[1]);

import dotenv from 'dotenv';
dotenv.config({ path: path.join(script_directory, '.env') });

import {
	fetch_by_https,
	verify_event,
	signed_fetch,
	generate_sign_preset,
} from "../lambda/lib/signed_fetch.mjs";

import event from './follow_event.json' assert {type: 'json'};

{
	const algorithm = 'RSA-SHA256';

	Promise.all(['./public.test.key', './private.test.key']
		.map(x => fs.readFile(path.join(script_directory, x))))
		.then(x => x.map(k => k.toString()))
		.then(([public_key, private_key]) => {
			const data = Buffer.from('Hello, world');
			const signature = crypto.sign(algorithm, data, private_key);
			const verified = crypto.verify(algorithm, data, public_key, signature);
			console.log('Result: ' + verified);

			return [public_key, private_key];
		})
		.catch(err => {
			console.error(err);
		})
}

test('Http signature', t => {
	return fs.readFile(path.join(script_directory, '..', '..', 'secret', 'priv.key'))
		.then(private_key => {
			return signed_fetch('https://hogehoge.fugafuga/users/user/inbox', {
				method: 'post',
				headers: {
					Accept: 'application/activity+json',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({

				}),
			}, generate_sign_preset(
				`https://${process.env.domain}/users/${Object.keys(JSON.parse(process.env.users))[0]}/info`,
				private_key,
				'mastodon'
			), true);
		})
		.then(verified => t.test('signed_fetch', () => assert(verified)))
		.catch(err => {
			console.error(err);
			throw err;
		});
});


test('verify_http_signatured_message_event', t => {
	// API Gatewayがホスト情報を書き換えるため、元のアクセスホストに戻す
	event.headers.host = 'mstdn.halzion.net';
	return verify_event(event)
		.then(verified => t.test('verified', assert(verified)));
});


test('fetch_by_https', t => {
	// google不通だと失敗するので、expressでサーバー建ててからそこにアクセスするように変える
	return fetch_by_https('https://www.google.com')
		.then(res => {
			t.test('Response', assert(res.ok));
			return res.text();
		})
		.then(text => {
			t.test('Fetched body', assert(text.startsWith('<!doctype html>')))
		});
});
