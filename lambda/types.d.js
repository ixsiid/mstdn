/**
 * @typedef IntegrationEvent
 * @prop {string} routeKey
 * @prop {string} rawPath
 * @prop {object} requestContext
 * @prop {string} rawPath
 * @prop {boolean} isBase64Encoded
 * @prop {Headers} heders
 * @prop {"GET"|"POST"|"PUT"|"PATCH"|"DELETE"} httpMethod
 * @prop {object} parsed_body
 */

/**
 * @typedef PathInfo
 * @prop {string} path
 * @prop {Array<string>} keys
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

/**
 * @typedef MastodonNotificationMessage
 * @prop {"favourite"|"mention"|"follow"|"reblog"|"follow_request"|"unfollow"|"status"} notification_type
 * @prop {string} icon URI encoded, e.g. encodeURIComponent('https://hogehoge.com')
 * @prop {string} title
 * @prop {string} body
 * @prop {"en"|"ja"} preferred_locale
 * @prop {number} notification_id
 */

/**
 * @typedef Subscription
 * @prop {string} endpoint
 * @prop {object} keys
 * @prop {string} keys.auth
 * @prop {string} keys.p256dh
 */