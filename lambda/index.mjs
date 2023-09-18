export const handler = async (event, context) => {
	console.debug(`[LAMBDA] ${event.rawPath}`);
	console.debug(JSON.stringify(event));

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
		const decoded = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body;
		const type = event.headers['content-type'].split(';')[0];
		switch (type) {
			case 'application/json':
				event.body = JSON.parse(decoded);
				break;
			case 'application/x-www-form-urlencoded':
				event.body = Object.fromEntries(
					decoded.split('&').map(x => x.split('=').map(x => decodeURIComponent(x)))
				);
				break;
			default:
				event.body = decoded;
		}
		console.debug(`[LAMBDA] postMessage: ${JSON.stringify(event.body, null, '\t')}`);
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
