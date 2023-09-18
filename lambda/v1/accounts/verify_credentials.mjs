import account from '../../data/account.mjs';

export default (event, auth, args) => ({
	...account,
	source: {
		privacy: 'public',
		sensitive: false,
		note: 'account note',
		fields: [],
	}
});
