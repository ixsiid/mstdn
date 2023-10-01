/**
 * @param {IntegrationEvent} event
 * @param {Auth} auth
 * @param {string} id
 */
export default (event, auth, id) => {
	const filter = {
		id: 1,
		title: 'Dummy filter',
		context: ['public'],
		expires_at: null,
		filter_action: 'hide',
		keywords: [],
		statuses: [],
	};

	if (id === undefined) {
		return ({
			GET: [],
			POST: filter,
			PUT: filter,
			DELETE: {},
		})[event.requestContext.http.method];
	}

	return { statusCode: 405 };
};
