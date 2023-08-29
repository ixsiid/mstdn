module.exports = (event, id) => {
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
		})[event.httpMethod];
	}

	return ({
		GET: filter,
		PUT: filter,
		POST: filter,
		DELETE: undefined
	})[event.httpMethod];
};
