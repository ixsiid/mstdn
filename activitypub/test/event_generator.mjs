import { Buffer } from 'node:buffer';

/**
 * @constructor
 * @param {string} stage_name 
 * @param {object} option 指定がない場合 process.env から読み取ります
 * @param {string} option.domain 
 * @param {string} option.aws_account_id
 * @param {string} option.aws_gateway_api_id
 * @returns {EventGenerator}
 * @example
 * const generator = new EventGenerator('your_stage_name');
 * generator.get('/your/access/endpoint'); 
 */
function a() { };

class EventGenerator {
	/** @type {string} */
	#stage;
	/** @type {string} */
	#domain;
	/** @type {string} */
	#aws_account_id;
	/** @type {string} */
	#aws_gateway_api_id;

	/**
	 * @param {string} path 
	 * @param {string | Object<string, string>} query 
	 * @param {object} auth_context 
	 * @returns 
	 */
	#create_event(method, path, query, auth_context) {
		const event_template = {
			version: '2.0',
			headers: {
				'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
				'accept-encoding': 'gzip, deflate, br',
				'accept-language': 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7',
				'cache-control': 'max-age=0',
				'content-length': '0',
				'sec-ch-ua': '"Chromium";v="116", "Not)A;Brand";v="24", "Google Chrome";v="116"',
				'sec-ch-ua-mobile': '?0',
				'sec-ch-ua-platform': '"Windows"',
				'sec-fetch-dest': 'document',
				'sec-fetch-mode': 'navigate',
				'sec-fetch-site': 'none',
				'sec-fetch-user': '?1',
				'upgrade-insecure-requests': '1',
				'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
				'x-amzn-trace-id': 'Root=1-6501b61f-3fc987243fc06c041947ae84',
				'x-forwarded-for': '123.45.67.89',
				'x-forwarded-port': '443',
				'x-forwarded-proto': 'https',
				'host': this.#domain,
			},
			requestContext: {
				http: {
					protocol: 'HTTP/1.1',
					sourceIp: '123.45.67.89',
					userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36'
				},
				accountId: this.#aws_account_id,
				apiId: this.#aws_gateway_api_id,
				domainName: this.#domain,
				domainPrefix: this.#domain.split('.')[0],
				requestId: 'LMlk7jfdIAMEY6A=',
				stage: this.#stage,
				time: '13/Sep/2023:13:16:15 +0000',
				timeEpoch: 1694610975288
			},
			isBase64Encoded: false
		};

		const _key = path.split('/').map(x => {
			const m = x.match(/^\{(.*?)=(.*?)\}/);
			return m ? '{' + m[1] + '}' : x;
		}).join('/');
		const _path = path.split('/').map(x => {
			const m = x.match(/^\{(.*?)=(.*?)\}/);
			return m ? m[2] : x;
		}).join('/')

		const e = JSON.parse(JSON.stringify(event_template));
		e.routeKey = `${method.toUpperCase()} ${_key}`;
		e.rawPath = `/${this.#stage}${_path}`;
		e.rawQueryString = query ? (
			typeof (query) === 'string' ? query : Object.entries(query)
				.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
				.join('&')
		) : '';

		e.requestContext.http.method = method.toUpperCase();
		e.requestContext.http.path = e.rawPath;
		e.requestContext.routeKey = e.routeKey;

		if (auth_context) e.requestContext.authorizer = auth_context;

		return e;
	};

	constructor(stage_name, { domain, aws_account_id, aws_gateway_api_id } = process.env) {
		this.#stage = stage_name;
		this.#domain = domain;
		this.#aws_account_id = aws_account_id;
		this.#aws_gateway_api_id = aws_gateway_api_id;
	};



	/**
	 * Getイベントを作ります
	 * @param {string} path 
	 * @param {string | Object<string, string>} query 
	 * @param {object} auth_context 
	 * @returns {IntegrationEvent}
	 */
	get(path, query, auth_context) { return this.#create_event('get', path, query, auth_context); };


	/**
	 * Postイベントを作ります
	 * @param {string} path 
	 * @param {string | Object<string, string>} query 
	 * @param {object} auth_context 
	 * @param {Buffer} body
	 * @returns {IntegrationEvent}
	 */
	post(path, query, auth_context, body) {
		const event = this.#create_event('post', path, query, auth_context);

		// JSON型以外は未実装
		event.headers['content-type'] = 'application/json; charset=utf-8';
		event.body = body.toString();

		return event;
	};
};

export default EventGenerator;
