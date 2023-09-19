import config from "../data/config.mjs";
const { client_id } = config;

/**
 * @param {IntegrationEvent} event
 * @param {Auth} auth
 * @returns {MethodResponse}
 */
export default event => {
	// アプリ固有にClient ID / Secretを作らずに既に作ってある単一のものを利用する
	return {
		statusCode: 200,
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			name: event.body.client_name,
			client_id,
			website: event.body.website ?? undefined,
			client_secret: 'dummy',
		}),
	};
};