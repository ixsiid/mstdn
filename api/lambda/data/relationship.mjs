/**
 * @typedef Relationship
 * @property {number} id
 * @property {boolean} following
 * @property {boolean} followed_by
 * @property {boolean} blocking
 * @property {boolean} muting
 * @property {boolean} requested
 */
export default {
	id: 0,
	following: false,
	followed_by: false,
	blocking: false,
	muting: false,
	requested: false,
};