module.exports = (event, args) => {
	return ({
		GET: [],
		POST: undefined,
		DELETE: undefined
	})[event.httpMethod];
};
