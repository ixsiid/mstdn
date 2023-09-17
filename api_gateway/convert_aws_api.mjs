// import api from './api.json' assert { type: 'json' };
// import integration from './integration.json' assert { type: 'json' };

// node ./api_gateway/convert_aws_api.mjs INPUT_FILE OUTPUT_FILE
// eg) node ./api_gateway/convert_aws_api.mjs ./api_gateway/api.json ./api.json

import fs from 'node:fs/promises';

fs.readFile(process.argv[2], 'utf-8')
	.then(t => JSON.parse(t))
	.then((api) => {
		const security = [{ [Object.keys(api.components.securitySchemes)[0]]: [] }];

		const authorization_required_paths = [
			'/v1/timelines/home:get',
			'/v1/timelines/direct:get',
			'/v1/timelines/list/{list_id+}:get',
			'/v1/timelines/tag/{hashtag+}:get',
			'/v1/statuses:post',
			'/v1/accounts/verify_credentials:get',
			'/v1/accounts/{id+}:get',
			'/v1/accounts/{id+}:post',
		];
		const integration = { $ref: '#/components/x-amazon-apigateway-integrations/lambda-integration' };

		api.info.version = new Date().toISOString();

		for (const k of Object.keys(api.paths)) {
			['get', 'post', 'put', 'patch', 'delete', 'any']
				.filter(method => method in api.paths[k])
				.forEach(method => {
					api.paths[k][method]['x-amazon-apigateway-integration'] = integration;
					if (authorization_required_paths.includes(`${k}:${method}`)) api.paths[k][method].security = security;
				});
		}

		return api;
	})
	.then(api => {
		fs.writeFile(process.argv[3], JSON.stringify(api, null, 2), 'utf-8');
		return { success: true };
	});
