// import api from './api.json' assert { type: 'json' };
// import integration from './integration.json' assert { type: 'json' };

// node ./api_gateway/convert_aws_api.mjs INPUT_FILE OUTPUT_FILE
// eg) node ./api_gateway/convert_aws_api.mjs ./api_gateway/api.json ./api.json

import fs from 'node:fs/promises';

fs.readFile(process.argv[2], 'utf-8')
	.then(t => JSON.parse(t))
	.then((api) => {
		api['x-amazon-apigateway-importexport-version'] = '1.0';

		api.components.securitySchemes['jwt-authorizer'] = {
			...api.components.securitySchemes['jwt-authorizer'],
			'x-amazon-apigateway-authorizer': {
				identitySource: '$request.header.Authorization',
				jwtConfiguration: {
					audience: [process.env.AWS_COGNITO_CLIENT_ID],
					issuer: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_COGNITO_USER_POOL_ID}`,
				},
				type: "jwt",
			}
		};

		api.components['x-amazon-apigateway-integrations'] = {
			'lambda-integration': {
				payloadFormatVersion: '2.0',
				type: 'aws_proxy',
				httpMethod: 'POST',
				uri: `arn:aws:apigateway:${process.env.AWS_REGION}:lambda:path/2015-03-31/functions/arn:aws:lambda:${process.env.AWS_REGION}:${process.env.AWS_ACCOUNT_ID}:function:${process.env.AWS_LAMBDA_FUNCTION_NAME}/invocations`,
				connectionType: 'INTERNET'
			}
		};

		const integration = { $ref: '#/components/x-amazon-apigateway-integrations/lambda-integration' };

		for (const k of Object.keys(api.paths)) {
			['get', 'post', 'put', 'patch', 'delete', 'any']
				.filter(method => method in api.paths[k])
				.forEach(method => {
					api.paths[k][method]['x-amazon-apigateway-integration'] = integration;
				});
		}

		return api;
	})
	.then(api => {
		fs.writeFile(process.argv[3], JSON.stringify(api, null, 2), 'utf-8');
		return { success: true };
	});
