import { vapid_public_key, client_id } from "../data/config.mjs";

/**
 * @param {IntegrationEvent} event
 * @returns {MethodResponse}
 */
export default event => {
	if (process.env.local_test) throw 'Do not run v1/apps method on local now';

	/** @type {V1AppsBody} */
	const q = event.parsed_body;

	return {
		statusCode: 200,
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			name: q.client_name,
			client_id,
			client_secret: 'not generated',
			website: event.body.website ?? undefined,
			vapid_key: vapid_public_key,
		}),
	};
};