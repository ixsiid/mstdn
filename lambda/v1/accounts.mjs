import account from '../data/account.mjs';
import relationship from '../data/relationship.mjs';

module.exports = (event, auth, id, command) => {
	if (!auth) return { statusCode: 401 };
	if (id !== auth.account_id) return { statusCode: 401 };

	if (command) {
		return ({
			followers: [],
			following: [],
			statuses: { statusCode: 404 },
			follow: relationship,
			unfollow: relationship,
			block: relationship,
			unblock: relationship,
			mute: relationship,
			unmute: relationship,
			pin: relationship,
			unpin: relationship,
			lists: { statusCode: 404 },
		})[command]
	}

	return account;
};
