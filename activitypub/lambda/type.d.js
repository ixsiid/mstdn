/**
 * @typedef {"Follow"|"Unfollow"|"FollowRequest"|"Undo"} ActivityType
 */

/**
 * @typedef Activity
 * @prop {string|Array<string>} "@context"
 * @prop {string} id
 * @prop {ActivityType} type
 * @prop {string} actor
 * @prop {object} object
 */