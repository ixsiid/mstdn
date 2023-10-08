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
 * @prop {string} rawQueryString
 * @prop {Object<string, string>} pathParameters
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

/**
 * @typedef V1AppsBody
 * @prop {string} client_name
 * @prop {string} redirect_uris Joinned by ','
 * @prop {string} scopes Joinned by '+' or ' '
 */

/**
 * @typedef Status
 * @prop {number} account_id
 * @prop {number} id
 * @prop {number} created_at
 * @prop {object} raw
 * @prop {Array<string>} raw.emojis
 * @prop {numbrer} raw.reblogs_count
 * @prop {"public"|"private"} raw.visibility
 * @prop {Array<string>} raw.media_attachments
 * @prop {Array<string>} raw.mentions
 * @prop {number} raw.favourites_count
 * @prop {string} raw.spoiler_text
 * @prop {number} raw.replies_count
 * @prop {boolean} raw.sensitive
 * @prop {string} raw.content
 * @prop {Array<string>} raw.tags
 */


/**
 * @typedef {"Accept"|"Add"|"Announce"|"Arrive"|"Bock"|"Create"|"Delete"|"Dislike"|"Flag"|"Follow"|"Ignore"|"Invite"|"Join"|"Leave"|"Like"|"Listen"|"Move"|"Offer"|"Question"|"Reject"|"Read"|"Remove"|"TentativeReject"|"TentativeAccept"|"Travel"|"Undo"|"Update"|"View"} ActivityType
 */

/**
 * @typedef {object|string} ActivityObject
 */


// @contextプロパティを表記する方法がないため、これだけ TypeScript Like
/**
 * @typedef {{
*   "@context": string|Array<string>,
*   id: string,
*   type: ActivityType,
*   actor: string,
*   object: ActivityObject,
*   attributedTo: ?string,
*   published: ?string,
*   to: ?Array<string>,
* }} Activity
*/

/**
* @typedef {"INSERT"} RecordEventName
*/
/**
* @typedef {"NEW_IMAGE"} RecordViewType
*/

/**
* @typedef DynamoDBRecord
* @prop {string} eventID
* @prop {RecordEventName} eventName
* @prop {string} eventVersion
* @prop {string} eventSource
* @prop {string} awsRegion
* @prop {object} dynamodb
* @prop {number} dynamodb.ApproximateCreationDateTime
* @prop {object} dynamodb.Keys
* @prop {object} dynamodb.NewImage marshallされた実際のレコード
* @prop {object} dynamodb.OldImage 
* @prop {string} dynamodb.SequenceNumber
* @prop {number} dynamodb.SizeBytes
* @prop {RecordViewType} dynamodb.StreamViewType "NEW_IMAGE"
* @prop {string} eventSourceARN
*/

/**
* @typedef UserInfo
* @prop {string} name
* @prop {string} preferredUsername
* @prop {string} summary
* @prop {string} acct
*/

/**
* @typedef Follower
* @prop {number} account_id
* @prop {string} actor
* @prop {boolean} is_valid
* @prop {number} last_modified
* @prop {"follow"|"follower"|"broadcast"} follow_type
* @prop {string} inbox
* @prop {string} outbox
* @prop {string} shared_inbox
*/

/**
 * @typedef ActorInbox
 * @prop {Array<string>} actors
 * @prop {string} inbox
 */
