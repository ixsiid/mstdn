import { CognitoIdentityProviderClient, CreateUserPoolClientCommand } from '@aws-sdk/client-cognito-identity-provider';

import { domain, vapid_key, user_pool_id, client_id } from "../data/config.mjs";

/**
 * @param {IntegrationEvent} event
 * @returns {MethodResponse}
 */
export default event => {
	if (process.env.local_test) throw 'Do not run v1/apps method on local now';

	/** @type {V1AppsBody} */
	const q = event.parsed_body;

	// スコープの確認は行っていないため意味はないが、将来のために一応設定しておく
	const valid_scopes = ['read', 'write', 'push'];
	const AllowedOAuthScopes = q.scopes.replaceAll('+', ' ').split(' ')
		.filter(x => valid_scopes.includes(x))
		.map(x => domain + '/' + x);

	const client = new CognitoIdentityProviderClient({});
	const input = {
		UserPoolId: user_pool_id,
		ClientName: q.client_name + '_' + new Date().getTime(),
		GenerateSecret: false,
		RefreshTokenValidity: 30,
		AccessTokenValidity: 1,
		IdTokenValidity: 1,
		TokenValidityUnits: {
			AccessToken: 'days',
			IdToken: 'days',
			RefreshToken: 'days',
		},
		ReadAttributes: [],
		WriteAttributes: [],
		ExplicitAuthFlows: ['ALLOW_REFRESH_TOKEN_AUTH', 'ALLOW_ADMIN_USER_PASSWORD_AUTH'],
		SupportedIdentityProviders: ['COGNITO'],
		CallbackURLs: q.redirect_uris.split(','),
		AllowedOAuthFlows: ['code'],
		AllowedOAuthScopes,
		AllowedOAuthFlowsUserPoolClient: true,
		PreventUserExistenceErrors: 'ENABLED',
		EnableTokenRevocation: true,
		AuthSessionValidity: 15, // minitues
	};

	const command = new CreateUserPoolClientCommand(input);
//	return client.send(command)
	return (async () => {})()
		.then(res => ({
			statusCode: 200,
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				// name: res.UserPoolClient.ClientName,
				// client_id: res.UserPoolClient.ClientId,
				name: q.client_name,
				client_id,
				client_secret: 'not generated', //res.UserPoolClient.ClientSecret,
				website: event.body.website ?? undefined,
				vapid_key,
			}),
		}))
		.catch(err => {
			console.debug(err);
			return {
				statusCode: 501,
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ error: 'Failed create client' }),
			};
		});
};