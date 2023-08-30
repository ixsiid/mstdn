const { domain } = require('./config.js');

/**
 * @typedef Status
 * @property {number} id
 * @property {string} uri
 * @property {string} created_at
 * @property {Account} account
 * @property {string} content
 * @property {'public'|'private'|'unlisted'|'direct'} visibility
 * @property {boolean} sensitive
 * @property {string} spoiler_text
 * @property {Array<*>} media_attachments
 * @property {Array<*>} mentions
 * @property {Array<*>} tags
 * @property {Array<*>} emojis
 * @property {number} reblogs_count
 * @property {number} favourites_count
 * @property {number} replies_count
 */

module.exports = {
	id: 0,
	uri: `https://${domain}/statuses/0`,
	created_at: '2000-01-01T00:01:00.000Z',
	account: require('./account.js'),
	content: 'Empty',
	visibility: 'public',
	sensitive: false,
	spoiler_text: '',
	media_attachments: [],
	mentions: [],
	tags: [],
	emojis: [],
	reblogs_count: 0,
	favourites_count: 0,
	replies_count: 0,
};
