import parse_body from "./lib/parse_body.mjs";
import parse_path from "./lib/parse_path.mjs";

export const handler = async event => {
	console.debug(`[LAMBDA] ${event.rawPath}`);
	console.debug(JSON.stringify(event));


	const { method, path, keys } = parse_path(event);
	const body = (['post', 'put'].includes(method) && event.body) ?
		parse_body(event.body, event.headers, event.isBase64Encoded) :
		undefined;

	console.debug({
		method,
		path,
		keys,
		body,
	});

	return {
		statusCode: 405
	};
};
