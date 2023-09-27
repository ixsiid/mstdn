import assert from 'node:assert';
import test from 'node:test';

import { fetch_by_https } from "../lambda/signed_fetch.mjs";

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

