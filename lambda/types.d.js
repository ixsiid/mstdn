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
 * @typedef MethodResponse
 * @prop {number} statusCode
 * @prop {?Heders} heders
 * @prop {?string} body
 */

/**
 * @typedef Point
 * @prop {number} x
 * @prop {number} y
 */

/**
 * @typedef MediaInfo
 * @prop {number} width
 * @prop {number} height
 * @prop {string} size "640x480"
 * @prop {number} aspect
 */

/**
 * @typedef MediaMeta
 * @prop {MediaInfo} original
 * @prop {MediaInfo} small
 * @prop {Point} focus
 */

/**
 * @typedef Media
 * @prop {string} id
 * @prop {"image"|"video"|"gifv"|"autdio"} type
 * @prop {string} url
 * @prop {string} preview_url
 * @prop {?string} remote_url
 * @prop {string} text_url
 * @prop {MediaMeta} meta
 * @prop {string} description
 * @prop {string} blurhash
 */