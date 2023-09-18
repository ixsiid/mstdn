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
 * @param {?object} auth_context
 * @param {string} query
 * @param {Buffer} body 
 * @returns {LambdaEvent}
 */
const generate_event = (path, method, auth_context, query = '', body = Buffer.from([])) => {
	if (path.startsWith('/api')) path = path.substring(4);

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

	if (method.toUpperCase() === 'POST') {
		e.headers['content-type'] = 'application/json; charset=utf-8';
		e.body = body.toString();
	}

	if (auth_context) e.requestContext.authorizer = auth_context;


	return e;
};



const request_authorize_event = {
	"version": "2.0",
	"type": "REQUEST",
	"identitySource": ["user1", "123"],
	"routeKey": "$default",
	"rawPath": "/my/path",
	"rawQueryString": "parameter1=value1&parameter1=value2&parameter2=value",
	"cookies": ["cookie1", "cookie2"],
	"headers": {
		"header1": "value1",
		"header2": "value2"
	},
	"queryStringParameters": {
		"parameter1": "value1,value2",
		"parameter2": "value"
	},
	"requestContext": {
		"accountId": "123456789012",
		"apiId": "api-id",
		"authentication": {
			"clientCert": {
				"clientCertPem": "CERT_CONTENT",
				"subjectDN": "www.example.com",
				"issuerDN": "Example issuer",
				"serialNumber": "a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1",
				"validity": {
					"notBefore": "May 28 12:30:02 2019 GMT",
					"notAfter": "Aug  5 09:36:04 2021 GMT"
				}
			}
		},
		"domainName": "id.execute-api.us-east-1.amazonaws.com",
		"domainPrefix": "id",
		"http": {
			"method": "POST",
			"path": "/my/path",
			"protocol": "HTTP/1.1",
			"sourceIp": "IP",
			"userAgent": "agent"
		},
		"requestId": "id",
		"routeKey": "$default",
		"stage": "$default",
		"time": "12/Mar/2020:19:03:58 +0000",
		"timeEpoch": 1583348638390
	},
	"pathParameters": { "parameter1": "value1" },
	"stageVariables": { "stageVariable1": "value1", "stageVariable2": "value2" }
};

/**
 * 
 * @param {string} token 
 * @returns {any}
 */
const generate_authorize_event = (token) => {
	const event = JSON.parse(JSON.stringify(request_authorize_event));
	event.routeArn = `arn:aws:execute-api:${process.env.region}:${process.env.aws_account_id}:${stage}/GET/request`;
	event.headers.authorization = `Bearer ${token}`;

	return event;
};

export default {
	generate_event,
	generate_authorize_event,
};
