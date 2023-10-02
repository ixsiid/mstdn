/**
 * @param {IntegrationEvent} event
 * @param {Auth} auth
 * @param {string} id
 */
export default (event, auth, id) => {
	const filter = {
		id: 1,
		phrase: 'dummy',
		context: ['home'],
		irreversible: false,
		whole_word: false,
		expires_at: null,
	};

	if (id === undefined) {
		return ({
			GET: [],
			POST: filter
		})[event.requestContext.http.method];
	}

	return ({
		GET: filter,
		PUT: filter,
		DELETE: {},
	})[event.requestContext.http.method];
};
