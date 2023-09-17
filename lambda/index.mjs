import config from './data/config.mjs';
const access_token = config.access_token;

export const handler = async (event, context) => {
	if (event.type === 'REQUEST') { // API Gatewayよりオーソライザーリクエスト
		const effect = (event.headers.authorization.split(' ').filter(x => x)[1] === access_token);
		if (effect) {
			//認証成功
			return {
				isAuthorized: true,
				context: {
					user: 0, //一人用のためユーザーIDは決め打ち
				},
			};
		} else {
			// 認証失敗
			return { isAuthorized: false };
		}
	}

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
		.then(() => import(`./${req.join('/')}.js`))
		.catch(() => import(`./${req.join('/')}.mjs`))
		.catch(err => {
			console.error(err);
			throw { statusCode: 501 };
		})
		.then(module => module.default)
		.then(func => func(event, ...query))
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
		}).then(result => result); // thenとcatchの結果を結合する
};
