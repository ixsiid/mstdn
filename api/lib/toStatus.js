module.exports = arg => {
	arg.uri =  `${require('../data/instance.js').urls}/statuses/${arg.id}`;
	arg.account = require('../data/account.js');
	if (typeof arg.created_at === 'number') arg.created_at = JSON.stringify(new Date(arg.created_at)).replace(/"/g, '');
	return arg;
 };
 