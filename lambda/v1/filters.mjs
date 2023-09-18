export default (event, auth, id) => {
	const filter = {
		id: 1,
		phrase: 'dummy',
		context: 'home',
		irreversible: false,
		whole_word: false
	};

	if (id === undefined) {
		return ({
			GET: [],
			POST: filter
		})[event.requestContext.http.path];
	}

	return ({
		GET: filter,
		PUT: filter,
		POST: filter,
		DELETE: undefined
	})[event.requestContext.http.path];
};
