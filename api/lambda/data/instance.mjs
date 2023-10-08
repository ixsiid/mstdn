import { url, domain, users } from './config.mjs';

/**
 * @typedef Instance
 * @property {string} uri
 * @property {object} urls
 * @property {string} urls.streaming_api
 * @property {string} title
 * @property {string} description
 * @property {string} email
 * @property {string} version
 * @property {Array<string>} languages
 */
export default {
	domain,
	title: `My Instance on ${domain}`,
	version: '2.5.0',
	source_url: 'https://github.com/ixsiid/mstdn',
	description: 'For only myself instance',
	usage: { users: { active_month: 0 } },
	languages: ['jp', 'en'],
	uri: domain,
	urls: {
		rest_api: url,
		// streaming_api: 'not implements',
	},
	email: users[0].acct,
};
