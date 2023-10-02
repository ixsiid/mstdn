import status from '../data/status.mjs';
import account from '../data/account.mjs';

/**
 * 
 * @param {*} event 
 * @param {*} args 
 * @returns {{accounts: Array<Account>, statuses: Array<Status>, hashtags: Array<string>}}
 */
export default (event, args) => {
	return {
		accounts: [account],
		statuses: [status],
		hashtags: [],
	};
};
