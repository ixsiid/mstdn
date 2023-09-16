const relation = require('../data/relationship.js');

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
			follow: relation,
			unfollow: relation,
			block: relation,
			unblock: relation,
			mute: relation,
			unmute: relation,
			pin: relation,
			unpin: relation,
			lists: { statusCode: 404 },
		})[command]
	}

	return require('../data/account.js');
};
