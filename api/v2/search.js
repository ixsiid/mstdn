/**
 * 
 * @param {*} event 
 * @param {*} args 
 * @returns {{accounts: Array<Account>, statuses: Array<Status>, hashtags: Array<string>}}
 */
module.exports = (event, args) => {
	return {
		accounts: [require('../data/account.js')],
		statuses: [require('../data/status_dummy.js')],
		hashtags: [],
	};
};
