import assert from 'node:assert';
import test from 'node:test';
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

const {
	domain,
} = process.env;

/** @type {UserInfo} */
const user = JSON.parse(process.env.user_test);

await test('Http signature', t => {
	return fs.readFile(path.join(script_directory, '..', '..', 'secret', 'priv.key'))
		.then(private_key => {
			return signed_fetch('https://hogehoge.fugafuga/users/user/inbox', {
				method: 'post',
				headers: {
					Accept: 'application/activity+json',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({}),
			}, generate_sign_preset(
				`https://${domain}/users/${user.preferredUsername}/info`,
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


await test('verify_http_signatured_message_event', t => {
	// API Gatewayがホスト情報を書き換えるため、元のアクセスホストに戻す
	event.headers.host = 'mstdn.halzion.net';
	return verify_event(event)
		.then(verified => t.test('verified', assert(verified)));
});


await test('fetch_by_https', t => {
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
