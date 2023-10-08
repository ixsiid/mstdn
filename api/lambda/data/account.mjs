import { domain, url, users } from './config.mjs';

/** @type {UserInfo} */
const user = users[0];

/**
 * @typedef Account
 * @property {number} id              The ID of the account
 * @property {string} username        The username of the account
 * @property {string} acct            Equals username for local users, includes @domain for remote ones
 * @property {string} display_name    The account's display name
 * @property {boolean} locked         Boolean for when the account cannot be followed without waiting for approval first
 * @property {string} created_at      The time the account was created
 * @property {number} followers_count The number of followers for the account
 * @property {number} following_count The number of accounts the given account is following
 * @property {number} statuses_count  The number of statuses the account has made
 * @property {string} note            Biography of user
 * @property {string} url             URL of the user's profile page (can be remote)
 * @property {string} avatar          URL to the avatar image
 * @property {string} avatar_static   URL to the avatar static image (gif)
 * @property {string} header          URL to the header image
 * @property {string} header_static   URL to the header static image (gif)
 * @property {Array<*>} emojis        Array of Emoji in account username and note
 * @property {?*} moved               If the owner decided to switch accounts, new account is in this attribute
 * @property {?Array<*>} fields       Array of profile metadata field, each element has 'name' and 'value'
 * @property {?boolean} bot           Boolean to indicate that the account performs automated actions
*/
export default {
	id: 0,
	username: user.preferredUsername,
	acct: user.acct,
	display_name: user.name,
	locked: false,
	created_at: '2000-01-01T00:00:00.000Z',
	followers_count: 0,
	following_count: 0,
	statuses_count: 0,
	note: user.summary,
	url,
	avatar: url + '/avatar/icon.png',
	avatar_static: url + '/avatar/icon.gif',
	header: url + '/avatar/header.png',
	header_static: url + '/avatar/header.gif',
	emojis: [],
	fields: [],
	bot: false
};