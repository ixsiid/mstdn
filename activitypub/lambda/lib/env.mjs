export const [public_key, private_key] = [process.env.public_key, process.env.private_key]
	.map(x => x.replace(/\\n/g, '\n'));

export const {
	domain,
	region,
} = process.env;

const instance = process.env.instance;
export const table_follows = instance + '-follows';

/** @type {Array<UserInfo> & Object<string, UserInfo>} */
export const users = process.env.users_list.split(',').map(u => JSON.parse(process.env['user_' + u]));
users.forEach(u => {
	u.acct = u.preferredUsername + '@' + domain;
	users[u.preferredUsername] = u;
});

/**
 * ロカールテスト時だけ、ローカルエンドポイントの値を入れます
 * @type {string|undefined}
 */
export const dynamodb_endpoint = process.env.dynamodb_endpoint;

/**
 * 
 * @param {string} username 
 * @returns {{base_url: string, owner: string, userinfo: UserInfo, key_id: string}}
 */
export const get_user_info = username => {
	const base_url = 'https://' + domain + '/users/' + username;
	return {
		base_url,
		owner: base_url + '/info',
		userinfo: users[username],
		key_id: base_url + '/info', // + '/key' では、Mastodonで認識しなかった
	};
};