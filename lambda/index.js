const { access_token } = require('./data/config.js');

exports.handler = async (event, context) => {
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

	if (method === 'POST') console.debug(`[LAMBDA] postMessage: ${JSON.stringify(JSON.parse(event.body), null, '\t')}`);

	const req = path
		.replace(/\{[a-zA-Z0-9]+\+\}/, '')
		.split('/')
		.filter(x => x);
	const query = event.rawPath.split('/').filter(x => x).slice(req.length);

	// ステージ名を取り除く
	req.shift();
	query.shift();

	const d = JSON.stringify(req);
	if (req.shift() !== 'api') {
		return { statusCode: 404 };
	}

	return await (async () => { })()
		.then(() => require(`./${req.join('/')}.js`))
		.catch(_ => { throw { statusCode: 501 }; })
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
			throw result;
		}).then(result => result); // thenとcatchの結果を結合する
};

function errorResponse(message) {
	const response = {
		statusCode: 200,
		body: 'Error: ' + message
	};
	return response;
};
