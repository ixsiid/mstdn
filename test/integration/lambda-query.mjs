import { Buffer } from 'node:buffer';

const stage = 'default';

const event = {
	"version": "2.0",
	"headers": {
		"accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
		"accept-encoding": "gzip, deflate, br",
		"accept-language": "ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7",
		"cache-control": "max-age=0",
		"content-length": "0",
		"sec-ch-ua": "\"Chromium\";v=\"116\", \"Not)A;Brand\";v=\"24\", \"Google Chrome\";v=\"116\"",
		"sec-ch-ua-mobile": "?0",
		"sec-ch-ua-platform": "\"Windows\"",
		"sec-fetch-dest": "document",
		"sec-fetch-mode": "navigate",
		"sec-fetch-site": "none",
		"sec-fetch-user": "?1",
		"upgrade-insecure-requests": "1",
		"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
		"x-amzn-trace-id": "Root=1-6501b61f-3fc987243fc06c041947ae84",
		"x-forwarded-for": "123.45.67.89",
		"x-forwarded-port": "443",
		"x-forwarded-proto": "https"
	},
	"requestContext": {
		"http": {
			"protocol": "HTTP/1.1",
			"sourceIp": "123.45.67.89",
			"userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36"
		},
		"requestId": "LMlk7jfdIAMEY6A=",
		"time": "13/Sep/2023:13:16:15 +0000",
		"timeEpoch": 1694610975288
	},
	"isBase64Encoded": false
};

/**
 * Create lambda event object
 * @param {string} path 
 * @param {string} method 
 * @param {string} query
 * @param {Buffer} body 
 * @returns {LambdaEvent}
 */
const generate_event = (path, method, query = '', body = Buffer.from([])) => {
	const e = JSON.parse(JSON.stringify(event));
	e.routeKey = `${method.toUpperCase()} ${path}`;
	e.rawPath = `/${stage}${path}`;
	e.rawQueryString = query;

	e.headers.host = process.env.domain;

	e.requestContext.accountId = '' + process.env.aws_account_id;
	e.requestContext.apiId = '' + process.env.aws_gateway_api_id;
	e.requestContext.domainName = process.env.domain;
	e.requestContext.domainPrefix = process.env.domain.split('.')[0];
	e.requestContext.http.method = method.toUpperCase();
	e.requestContext.http.path = e.rawPath;

	e.requestContext.routeKey = e.routeKey;
	e.requestContext.stage = stage;

	return e;
};

export default {
	generate_event,
};
