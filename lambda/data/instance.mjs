import config from './config.mjs';

/**
 * @typedef Instance
 * @property {string} uri
 * @property {string} urls
 * @property {string} title
 * @property {string} description
 * @property {string} email
 * @property {string} version
 * @property {Array<string>} languages
 */
export default {
	uri: config.domain,
	urls: `https://${config.domain}`,
	title: `My Instance on ${config.domain}`,
	description: 'For only myself instance',
	email: config.email,
	version: '2.5.0',
	languages: ['jp', 'en'],
};
