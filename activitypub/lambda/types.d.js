// UnfollowとFollorRequestは誤解していた。
// Todo: Unfollowはindex.mjs内で制御に使っているためそこも一緒に修正して消す
/**
 * @typedef {"Accept"|"Add"|"Announce"|"Arrive"|"Bock"|"Create"|"Delete"|"Dislike"|"Flag"|"Follow"|"Ignore"|"Invite"|"Join"|"Leave"|"Like"|"Listen"|"Move"|"Offer"|"Question"|"Reject"|"Read"|"Remove"|"TentativeReject"|"TentativeAccept"|"Travel"|"Undo"|"Update"|"View"|"Unfollow"|"FollowRequest"} ActivityType
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
 */


/**
 * 
 */