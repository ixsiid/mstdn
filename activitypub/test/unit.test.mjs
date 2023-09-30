import assert from 'node:assert';
import test from 'node:test';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
	fetch_by_https,
	verify_event,
} from "../lambda/signed_fetch.mjs";

import event from './follow_event.json' assert {type: 'json'};

{
	const algorithm = 'RSA-SHA256';

	Promise.all(['./public.test.key', './private.test.key']
		.map(x => fs.readFile(path.join('test', x))))
		.then(x => x.map(k => k.toString()))
		.then(([public_key, private_key]) => {
			const data = Buffer.from('Hello, world');
			const signature = crypto.sign(algorithm, data, private_key);
			const verified = crypto.verify(algorithm, data, public_key, signature);
			console.log('Result: ' + verified);
		});
}


{
	const signature_header = event.headers.signature;

	const s = signature_header.split(',').map(x => x.match(/^(.*?)\="(.*?)"$/));
	const algorithm = s.find(x => x[1] === 'algorithm')[2].toUpperCase();
	const key_id = s.find(x => x[1] === 'keyId')[2];
	const signature = s.find(x => x[1] === 'signature')[2];

	const data = await Promise.all(
		s.find(x => x[1] === 'headers')[2]
			.split(' ')
			.map(async header => {
				if (header === '(request-target)') {
					return `(request-target): ${event.requestContext.http.method.toLowerCase()} ${event.requestContext.http.path}`;
				}

				if (header === 'host') {
					// API Gatewayがホスト情報を書き換えるため、元のアクセスホストに戻す
					return `host: mstdn.halzion.net`;
				}

				if (header === 'digest') {
					// Digest Hashの検証を行う
					await crypto.subtle.digest('SHA-256', Buffer.from(event.body))
						.then(b => Buffer.from(b).toString("base64"))
						.then(hash => 'SHA-256=' + hash)
						.then(digest => assert.equal(digest, event.headers.digest));
					// 署名検証用dataは後続処理と共通化できる
				}

				return `${header}: ${event.headers[header]}`;
			})
	).then(d => d.join('\n'));

	console.log('Algorithm: ' + algorithm);
	console.log('KeyId: ' + key_id);

	await fetch(key_id, { headers: { 'Accept': 'application/activity+json' } })
		.then(res => res.json())
		.then(activity => {
			const public_key = activity.publicKey.publicKeyPem;
			return crypto.verify(
				algorithm,
				Buffer.from(data),
				public_key.trim(),
				Buffer.from(signature, 'base64'));
		})
		.then(verified => assert(verified));
}

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
