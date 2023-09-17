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
	uri: config.domain,
	urls: {
		rest_api: config.url,
		// streaming_api: 'not implements',
	},
	title: `My Instance on ${config.domain}`,
	description: 'For only myself instance',
	email: config.email,
	version: '2.5.0',
	languages: ['jp', 'en'],
};
