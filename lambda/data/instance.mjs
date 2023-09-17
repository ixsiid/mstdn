import config from './config.mjs';

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
	domain: config.domain,
	title: `My Instance on ${config.domain}`,
	version: '2.5.0',
	source_url: 'https://github.com/ixsiid/mstdn',
	description: 'For only myself instance',
	usage: { users: { active_month: 0 } },
	languages: ['jp', 'en'],
	uri: config.domain,
	urls: {
		rest_api: config.url,
		// streaming_api: 'not implements',
	},
	email: config.email,
};
