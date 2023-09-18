/**
 * @typedef IntegrationEvent
 * @prop {object} requestContext
 * @prop {string} rawPath
 * @prop {boolean} isBase64Encoded
 * @prop {Headers} heders
 * @prop {"GET"|"POST"|"PUT"|"PATCH"|"DELETE"} httpMethod
 */

/**
 * @typedef Auth
 * @prop {string} username
 * @prop {number} account_id
 * @prop {Array<"read"|"write"|"push">} scopes
 */

/**
 * @typedef Response
 * @prop {number} statusCode
 * @prop {?Heders} heders
 * @prop {?string} body
 */
