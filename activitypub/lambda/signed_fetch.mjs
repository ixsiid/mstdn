import crypto from 'node:crypto';
import https from 'node:https';

/**
 * fetchではDateヘッダーが使えないため同等機能をhttpsで実現する
 * @param {string} url 
 * @param {object} options
 * @param {"get"|"post"} options.method 
 * @param {Object<string, string>} options.headers
 * @param {string} options.body
 * @returns {Promise<Response>}
 */
export const fetch_by_https = (url, options = { method: 'get' }) => new Promise((resolve, reject) => {
	const _url = new URL(url);
	const _options = {
		method: options.method ?? "get",
		port: 443,
		hostname: _url.hostname,
		path: _url.pathname + _url.search,
		headers: options.headers ?? {},
	};

	const body = (() => {
		if (options.body) {
			_options.headers['Content-Length'] = Buffer.byteLength(options.body);
			return options.body;
		}
	})();

	const req = https.request(_options, res => {
		const chunks = [];
		res.on('data', chunk => {
			chunks.push(chunk);
		});

		res.on('end', () => resolve(new Response(Buffer.concat(chunks), {
			status: res.statusCode,
			statusText: res.statusMessage,
			headers: res.headers,
		})));
	});

	req.on('error', err => reject(err));
	if (body) req.write(body);
	req.end();
});

/**
 * fetch with Http signature
 * @param {string} url 
 * @param {object} options
 * @param {"get"|"post"} options.method
 * @param {Object<string, string>} options.headers 
 * @param {string} options.body
 * @param {object} sign_options
 * @param {string} sign_options.key_id
 * @param {string} sign_options.private_key
 * @param {"standard"|"mastodon"} sign_options.mode
 * @returns {Promise<Response>}
 */
export const signed_fetch = (url, options, sign_options) => {
	const { method, headers, body } = options;
	const { key_id, private_key } = sign_options;

	const _url = url.substring(url.indexOf(':') + 1).split('/').filter(x => x.length > 0);
	const host = _url.shift();

	const now = new Date();
	const now_time = Math.floor(now.getTime() / 1000);

	const digest = 'SHA-256=' + crypto.subtle.digest('SHA-256', Buffer.from(body));
	const header_keys = Object.keys(options.headers).sort();

	const signee = [
		`(request-target): ${(method ?? 'get').toLowerCase()}`,
		`(created): ${now_time} ${_url.join('/')}`,
		`host: ${host}`,
		`date: ${now.toUTCString()}`,
		`digest: ${digest}`,
		...(header_keys.map(k => `${k.toLowerCase()}: ${options.headers[k]}`))
	].join('\n');


	const signer = crypto.createSign('RSA-SHA256');
	signer.update(signee);
	const signature = signer.sign(private_key, 'base64');

	headers.Date = now.toUTCString();
	headers.Signature = [
		`keyId="${key_id}"`,
		'algorithm="hs2019"',
		`created=${now_time}`,
		`expires=${now_time}`,
		[
			'headers="(request-target) (created) host date digest',
			...header_keys.map(x => x.toLowerCase())
		].join(' '),
		'signature=' + signature,
	].join(', ');

	return fetch_by_https(url, options);
};

/**
 * Http Signatureを検証します
 * @param {IntegrationEvent} event lambda関数 eventオブジェクト
 * @returns {Promise<boolean>}
 */
export const verify_event = async (event) => {
	// ToDo Mastdon形式になっているので標準と切り替えられるようにする
	/** @type {Array<string>} */
	const signature_header = event.headers.signature;

	/** @type {Array<Array<string>>} */
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

				if (header === 'digest') {
					// Digest Hashの検証を行う
					await crypto.subtle.digest('SHA-256', Buffer.from(event.body))
						.then(b => Buffer.from(b).toString("base64"))
						.then(hash => 'SHA-256=' + hash)
						.then(digest => {
							if (digest !== event.headers.digest) {
								throw 'Digest of Body is unmatch with in signature';
							}
						})
					// 署名検証用dataは後続処理と共通化できる
				}

				return `${header}: ${event.headers[header]}`;
			})
	).then(d => d.join('\n'));

	console.debug('Algorithm: ' + algorithm);
	console.debug('KeyId: ' + key_id);

	return fetch(key_id, { headers: { 'Accept': 'application/activity+json' } })
		.then(res => res.json())
		.then(activity => {
			/** @type {string} */
			const public_key = activity.publicKey.publicKeyPem;
			return crypto.verify(
				algorithm,
				Buffer.from(data),
				public_key,
				Buffer.from(signature, 'base64'));
		})
		.then(verified => {
			if (!verified) throw 'Signatures do not match.';
			return true;
		})
};