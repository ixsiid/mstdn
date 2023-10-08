import account from '../data/account.mjs';
import { url } from '../data/config.mjs';

export default arg => {
	arg.uri = url + '/statuses/' + arg.id;
	arg.account = JSON.parse(JSON.stringify(account));
	if (typeof arg.created_at === 'number') {
		arg.created_at = JSON.stringify(new Date(arg.created_at)).replace(/"/g, '');
	}
	return arg;
};
