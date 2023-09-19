const login_form = `<!DOCTYPE html>
<html>

<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=320">
	<title>Login to mstdn.halzion.net</title>
	<script>
		window.addEventListener('load', () => {
			{
				const form = document.querySelector('#login_form');
				const queries = window.location.search
					.substring(1)
					.split('&')
					.map(x => x.split('='));
				queries.forEach(([key, value]) => {
					const input = document.createElement('input');
					input.setAttribute('type', 'hidden');
					input.setAttribute('name', key);
					input.setAttribute('value', value);
					form.appendChild(input);
				});
			}
		}, { once: true })
	</script>
	<style>
		#welcome {
			width: 100%;
			padding: 2%;
			margin: 0;
			font-size: 1.5em;
			text-align: center;
		}
		label {
			display: inline-block;
			margin: .3em 0;
			padding: 2%;
			width: 30%;
		}
		input[type="email"], input[type="password"] {
			display: inline-block;
			width: 60%;
			margin: .3em 0;
			padding: 2%;
		}
		input[type="submit"] {
			display: block;
			margin: 2em 1em auto auto;
			padding: 0.5em 1.0em;
		}
	</style>
</head>

<body>
	<p id="welcome">Welcom to mstdn.halzion.net</p>
	<form id="login_form" action="/oauth/login" method="post" formenctype="application/x-www-form-urlencoded">
		<label for="email">Mail</label><input id="email" type="email" name="email" />
		<label for="password">Password</label><input id="password" type="password" name="password" />
		<input type="hidden" name="pool_id" value="${process.env.pool_id}" />
		<input type="submit" id="login" value="Log in" />
	</form>
</body>

</html>`;

import { CognitoIdentityProviderClient, AdminInitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';

const AuthenticationResultCache = {};

export const handler = async event => {
	console.debug(`[LAMBDA] ${event.rawPath}`);
	console.debug(JSON.stringify(event));

	const api_method = event.rawPath.split('?')[0];

	// /oauth/authorize だけGETメソッドなため先に処理してしまう。
	if (api_method === '/oauth/authorize') {
		return {
			statusCode: 200,
			headers: { 'content-type': 'text/html' },
			body: login_form,
		};
	}

	if (!(['/oauth/token', '/oauth/revoke', '/oauth/login'].includes(api_method))) {
		return { statusCode: 404 };
	}

	const method = event.requestContext.http.method.toUpperCase();
	if (method !== 'POST') return { statusCode: 401 };


	const body = (() => {
		const decoded = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body;
		const type = event.headers['content-type'].split(';')[0];
		switch (type) {
			case 'application/json':
				return JSON.parse(decoded);
			case 'application/x-www-form-urlencoded':
				return Object.fromEntries(
					decoded.split('&').map(x => x.split('=').map(x => decodeURIComponent(x)))
				);
			default:
				return decoded;
		}
	})();
	console.debug(`[LAMBDA] postMessage: ${JSON.stringify(body, null, '\t')}`);

	if (api_method === '/oauth/login') {
		const client = new CognitoIdentityProviderClient({});
		const input = {
			AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
			ClientId: body.client_id,
			UserPoolId: body.pool_id,
			AuthParameters: {
				USERNAME: body.email,
				PASSWORD: body.password,
			},
		};
		console.debug(JSON.stringify(input));
		const command = new AdminInitiateAuthCommand(input);
		const code = await client.send(command)
			.then(res => {
				const id = res.$metadata.requestId;
				AuthenticationResultCache[id] = res.AuthenticationResult;
				return id;
			});
		const queries = [
			['code', code],
			...decodeURIComponent(body.state).split(',').map(x => x.split(':')),
		];
		const query_string = 'code=' + code + (body.state ? '&state=' + body.state : '');
		console.debug(query_string);
		return {
			statusCode: 302,
			headers: {
				location: decodeURIComponent(body.redirect_uri) + '?' + query_string,
			},
		};
	}

	if (api_method === '/oauth/token') {
		if (body.grant_type === 'client_credentials') {
			delete body.grant_type;
			delete body.client_secret;
			return {
				statusCode: 200,
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ ...body, access_token: 'dummy_token' }),
			}
		}

		if (body.grant_type === 'refresh_token') {
			return {
				statusCode: 500
			};
		}

		if (body.grant_type === 'authorization_code') {
			if (body.code in AuthenticationResultCache) {
				const t = AuthenticationResultCache[body.code];
				const r = {
					scope: 'read write push',
					created_at: new Date().getTime(),
					access_token: t.AccessToken,
					refresh_token: t.RefreshToken,
					expires_in: t.ExpiresIn,
					token_type: t.TokenType,
				};
				console.debug(JSON.stringify(r));
				return {
					statusCode: 200,
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify(r),
				};
			}

			return {
				statusCode: 401,
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ error: 'Not permitted' }),
			};
		}

		console.debug('401: unauthorized');
		console.debug(JSON.stringify(AuthenticationResultCache));
		console.debug(body.code);
		return {
			statusCode: 401,
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ error: 'Unknown grant type' }),
		};
	}


	if (api_method === '/oauth/token') {
		return {
			statusCode: 200,
			headers: { 'content-type': 'application/json' },
			body: '{}'
		};
	}

	return { statusCode: 501 };
};
