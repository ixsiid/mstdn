import config from '../../data/config.mjs';
const { domain, vapid_key } = config;

/**
 * @param {IntegrationEvent} event
 * @param {Auth} auth
 * @returns {MethodResponse}
 */
export default (event, auth) => {
	if (event.httpMethod === 'GET') {
		return { statusCode: 404 };
		return {
			statusCode: 200,
			heders: { type: 'application/json' },
			body: JSON.stringify({
				id: auth.account_id,
				endpoint: `https://${domain}/api/v1/push/listener`,
				alerts: {
					follow: false,
					favourite: false,
					reblog: false,
					mention: true,
					poll: false
				},
				server_key: vapid_key
			})
		};
	}
	if (event.httpMethod === 'POST') { }
	if (event.httpMethod === 'PUT') { }
	return { statusCode: 404 };
};