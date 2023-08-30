const { access_token } = require('./data/config.js');

exports.handler = async (event, context) => {
	console.log(`[LAMBDA] ${event.httpMethod}: ${event.path}`);

	if (event.type === 'TOKEN') { // API Gateway オーソライザー
		const Effect = (event.authorizationToken.split(' ').filter(x => x)[1] === access_token) ? 'Allow' : 'Deny';
		return ({
	        principalId: '*',
	        policyDocument: {
	            Version: '2012-10-17',
	            Statement: [{
                    Action: 'execute-api:Invoke',
                    Effect,
                    Resource: event.methodArn,
	            }],
	        },
	    });
	}
	
	// それ以外のリクエスト
	if (event.httpMethod === 'POST') console.log(`[LAMBDA] postMessage: ${JSON.stringify(JSON.parse(event.body), null, '\t')}`);
	
	const req = event.resource.replace(/\{[a-zA-Z0-9]+\+\}/, '').split('/').filter(x => x);
	const query = event.path.split('/').filter(x => x).slice(req.length);
	const d = JSON.stringify(req);
	if (req.shift() !== 'api') {
		 return errorResponse('No mastodon api request'+d);
	}

	const value = await require(`./${req.join('/')}.js`)(event, ...query);
	
	return {
		 statusCode: 200,
		 headers : {'content-type' : 'application/json'},
		 body: value === undefined ? '' : JSON.stringify(value)
	};
};

function errorResponse (message) {
	const response = {
		 statusCode: 200,
		 body: 'Error: ' + message
	};
	return response;
};
