import parse_body from "./lib/parse_body.mjs";
import parse_path from "./lib/parse_path.mjs";

export const handler = async event => {
	console.debug(`[LAMBDA] ${event.rawPath}`);
	console.debug(JSON.stringify({ ...event, body: undefined }));

	/** @type {Auth} */
	const auth = (() => {
		if (!event.requestContext.authorizer) return undefined;
		const authorizer = event.requestContext.authorizer;
		if ('jwt' in authorizer) {
			return {
				username: authorizer.jwt.claims?.username,
				account_id: 0, // It's constant value for "Solo"
				scopes: ['read', 'write', 'push'], // authorizer.jwt.scopes
			};
		}
	})();
	console.debug(`Auth: ${JSON.stringify({origin: event.requestContext.authorizer, parse:auth}, null, 2)}`);

	const { method, path, keys } = parse_path(event);
	// 互換性のため
	event.httpMethod = method.toUpperCase();

	if (['post', 'put'].includes(method) && event.body) {
		event.parsed_body = parse_body(event.body, event.headers, event.isBase64Encoded);

		// 互換性のため
		event.body = event.parsed_body;
	}

	return await (async () => { })()
		.then(() => import(`.${path}.mjs`))
		.catch(err => {
			console.error(err);
			throw { statusCode: 501 };
		})
		.then(module => module.default)
		.then(func => func(event, auth, ...keys))
		.then(result => {
			if (typeof (result?.statusCode) === 'number') return result;

			return {
				statusCode: 200,
				headers: { 'content-type': 'application/json' },
				body: result === undefined ? '' : JSON.stringify(result),
			};
		})
		.catch(result => {
			if (typeof (result?.statusCode) === 'number') return result;
			console.error(result);
			throw result;
		}).then(result => {
			// thenとcatchの結果を結合する
			console.debug(`[LAMBDA] response for ${event.rawPath}`);
			console.debug(JSON.stringify(result));
			return result;
		});
};
