module.exports = (event, id, command) => {
	if (id !== '1') {
		 return { error: "Invalid user id" };
	}
	if (command) {
		 const error = {
			  error: "Invalid access token"
		 };
		 
		 const relation = require('../data/relationship.js');

		 return ({
			  followers: [],
			  following: [],
			  statuses: error,
			  follow: relation,
			  unfollow: relation,
			  block: relation,
			  unblock: relation,
			  mute: relation,
			  unmute: relation,
			  pin: relation,
			  unpin: relation,
			  lists: error
		 })[command]
	}
	
	return require('../data/account.js');
};
