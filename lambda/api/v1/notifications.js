/**
 * 
 * @param {*} event 
 * @param {number} id 
 * @returns {{id: number, type: string, created_at: string, account: Account, status: ?*}}
 */

module.exports = (event, id) => {
	if (id === undefined) return [];

	return {
		id,
		type: 'reblog',
		created_at: '2018-10-04T00:00:00.000Z',
		account: require('../data/account.js'),
		// status: require('../data/status0.js')
	};
};
