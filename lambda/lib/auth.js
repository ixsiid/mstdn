module.exports = event => {
	if (event.headers.authorization) {
		const token = event.headers.authorization.replace(/Bearer\s/, '').replace(/\s/g, '');
		return token === require('../data/config.js').access_token;
	}
	return false;
};

