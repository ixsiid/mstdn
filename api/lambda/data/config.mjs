export const {
	region,
	s3bucket,

	domain,
	vapid_public_key,
	vapid_private_key,
	client_id,
} = process.env;


export const url = 'https://' + domain;

const users_list = process.env.users_list.split(',');

/** @type {Array<UserInfo> & Object<string, UserInfo>} */
export const users = users_list.map(u => JSON.parse(process.env['user_' + u]));
users.forEach(u => {
	u.acct = u.preferredUsername + '@' + domain;
	users[u.preferredUsername] = u;
});

// users[0] がオーナー

