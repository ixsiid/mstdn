module.exports = (event, args) => {
	if (args === undefined) return [];

	if (event.httpMethod === 'DELETE') {
		return undefined;
	}
};