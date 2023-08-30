module.exports = event => {
	if (event.headers.Authorization) {
		const token = event.headers.Authorization.replace(/Bearer\s/, '').replace(/\s/g, '');
		return token === require('../data/config.js').access_token;
	}
	return false;
};

