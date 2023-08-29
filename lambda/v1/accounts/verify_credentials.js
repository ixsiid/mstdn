module.exports = (event, args) => {
	const auth = require('../../lib/auth.js');
	if (auth(event)) {
		return {
			...require('../../data/account.js'),
			source: {
				privacy: 'public',
				sensitive: false,
				note: 'account note',
				fields: [],
			}
		};
	}
	return {
		error: 'Invalid access token'
	};
	/*
		privacy	 Selected preference: Default privacy of new toots
		sensitive Selected preference: Mark media as sensitive by default?
		note	    Plain-text version of the account's note
		fields	 Array of profile metadata, each element has 'name' and 'value'
	*/
};
