module.exports = (event, args) => {
	return {
		...require('../../data/account.js'),
		source: {
			privacy: 'public',
			sensitive: false,
			note: 'account note',
			fields: [],
		}
	};
};
