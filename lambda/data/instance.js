const { domain, email } = require('./config.js');

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
module.exports = {
	uri: domain,
	urls: `https://${domain}`,
	title: `My Instance on ${domain}`,
	description: 'For only myself instance',
	email,
	version: '2.5.0',
	languages: ['jp', 'en'],
};
