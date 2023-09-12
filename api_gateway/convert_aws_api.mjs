// import api from './api.json' assert { type: 'json' };
// import integration from './integration.json' assert { type: 'json' };

import fs from 'node:fs/promises';

fs.readFile('./api_gateway/api.json', 'utf-8')
	.then(t => JSON.parse(t))
	.then((api) => {
		const security = [{ [Object.keys(api.components.securitySchemes)[0]]: [] }];

		const authorization_required_paths = [
			'/api/v1/timelines/home:get',
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
		fs.writeFile('./aws_api.json', JSON.stringify(api, null, 2), 'utf-8');
		return { success: true };
	});


