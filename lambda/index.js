const { access_token } = require('./data/config.js');

exports.handler = async (event, context) => {
	if (event.type === 'REQUEST') { // API Gatewayよりオーソライザーリクエスト
		const effect = (event.headers.authorization.split(' ').filter(x => x)[1] === access_token);
		return {
			isAuthorized: effect,
			context: {
				user: 0,
			},
		};
	}

	const method = event.requestContext.http.method;
	const path = event.requestContext.http.path;

	// それ以外のリクエスト
	if (method === 'POST') console.log(`[LAMBDA] postMessage: ${JSON.stringify(JSON.parse(event.body), null, '\t')}`);

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
		return errorResponse('No mastodon api request' + d);
	}

	const value = await require(`./${req.join('/')}.js`)(event, ...query);

	return {
		statusCode: 200,
		headers: { 'content-type': 'application/json' },
		body: value === undefined ? '' : JSON.stringify(value)
	};
};

function errorResponse(message) {
	const response = {
		statusCode: 200,
		body: 'Error: ' + message
	};
	return response;
};
