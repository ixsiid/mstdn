import account from '../data/account.mjs';
import relationship from '../data/relationship.mjs';

module.exports = (event, id, command) => {
	const authorizer = event.requestContext.authorizer;
	if (authorizer?.lambda?.user !== 0) return { statusCode: 401 };
	if (authorizer.lambda.user !== id) return { statusCode: 401 };
	if (id !== 0) return { statusCode: 404 };

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
