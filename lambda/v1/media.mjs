import { url } from './instance.mjs';

/**
 * @typedef Media
 * @property {number} id           ID of the attachment
 * @property {string} type         One of: "image", "video", "gifv", "unknown"
 * @property {string} url	     no  URL of the locally hosted version of the image
 * @property {?string} remote_url  For remote images, the remote URL of the original image
 * @property {string} preview_url  URL of the preview image
 * @property {?string} text_url    Shorter URL for the image, for insertion into text (only present on local images)
 * @property {?*} meta             See attachment metadata below
 * @property {?string} description A description of the image for the visually impaired (maximum 420 characters), or null if none provided
 */

/**
 * 
 * @param {*} event 
 * @param {number} id 
 * @returns {Media}
 */
export default (event, id) => {
	if (id === undefined) {
		return {
			id: 1001,
			type: 'unknown',
			url: `${url}/media/1001`,
			preview_url: `${url}/media/1001.thumb`,
			description: 'It is dummy response, because attachment media is not improvement.'
		};
	}

	return {
		id: 1001,
		type: 'unknown',
		url: `${url}/media/1001`,
		preview_url: `${url}/media/1001.thumb`,
		description: 'It is dummy response, because attachment media is not improvement.'
	};
};
