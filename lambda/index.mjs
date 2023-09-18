const parse_body = (body, headers, isBase64Encoded) => {
	const buffer = isBase64Encoded ? Buffer.from(body, 'base64') : undefined;
	const type = headers['content-type'].split(';')[0];
	switch (type) {
		case 'application/json':
			return JSON.parse(buffer?.toString() ?? body);
		case 'application/x-www-form-urlencoded':
			return Object.fromEntries(
				(buffer?.toString() ?? body)
					.split('&')
					.map(x => x.split('=').map(x => decodeURIComponent(x)))
			);
		case 'multipart/form-data':
			const boundary = Buffer.from('\r\n--' + headers['content-type'].split('boundary=').pop());
			const buffer_parts = [];
			let i = boundary.length;
			while (true) {
				const sep = buffer.indexOf(boundary, i);
				if (sep < 0) break;
				buffer_parts.push(buffer.subarray(i, sep - i));
				i += sep + boundary.length + 2; // boudary後続の\r\n
			}

			const parts = buffer_parts.map(b => {
				const s = b.indexOf(Buffer.from('\r\n\r\n'));
				const header = Object.fromEntries(
					b.subarray(0, s)
						.toString()
						.split('\r\n')
						.map(x => x.split(': '))
				);

				const body = b.subarray(s + 4);

				return {
					header,
					body,
				};
			});
			console.debug(`${parts.map(x => `${JSON.stringify(x.header)}\n:::\n${x.body.length}`)}`);
			return parts;
		default:
			return buffer?.toString() ?? body;
	}
};

export const handler = async event => {
	console.debug(`[LAMBDA] ${event.rawPath}`);
	console.debug(JSON.stringify({ ...event, body: undefined }));

	/** @type {Auth} */
	const auth = (() => {
		if (!event.requestContext.authorizer) return undefined;
		const authorizer = event.requestContext.authorizer;
		if ('jwt' in authorizer) {
			return {
				username: authorizer.jwt.claims?.username,
				account_id: 0, // It's constant value for "Solo"
				scopes: ['read', 'write', 'push'], // authorizer.jwt.scopes
			};
		}
	})();

	const method = event.requestContext.http.method;
	const path = event.requestContext.http.path;

	if (method === 'POST' && event.body) {
		event.parsed_body = parse_body(event.body, event.headers, event.isBase64Encoded);
		
		// 互換性のため
		event.body = event.parse_body;
	}

	const req = path
		.replace(/\{[a-zA-Z0-9]+\+\}/, '')
		.split('/')
		.filter(x => x);
	const query = event.rawPath.split('/').filter(x => x).slice(req.length);

	// ステージ名を取り除く
	req.shift();
	query.shift();

	// if (req.shift() !== 'api') return { statusCode: 404 };

	return await (async () => { })()
		.then(() => import(`./${req.join('/')}.mjs`))
		.catch(err => {
			console.error(err);
			throw { statusCode: 501 };
		})
		.then(module => module.default)
		.then(func => func(event, auth, ...query))
		.then(result => {
			if (typeof (result?.statusCode) === 'number') return result;

			return {
				statusCode: 200,
				headers: { 'content-type': 'application/json' },
				body: result === undefined ? '' : JSON.stringify(result),
			};
		})
		.catch(result => {
			if (typeof (result?.statusCode) === 'number') return result;
			console.error(result);
			throw result;
		}).then(result => {
			// thenとcatchの結果を結合する
			console.debug(`[LAMBDA] response for ${event.rawPath}`);
			console.debug(JSON.stringify(result));
			return result;
		});
};
