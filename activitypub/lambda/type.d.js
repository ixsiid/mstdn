/**
 * @typedef {"Follow"|"Unfollow"|"FollowRequest"|"Undo"} ActivityType
 */

/**
 * @typedef {object|string} ActivityObject
 */

/**
 * @typedef Activity
 * @prop {string|Array<string>} "@context"
 * @prop {string} id
 * @prop {ActivityType} type
 * @prop {string} actor
 * @prop {ActivityObject} object
 */

/**
 * @typedef {"INSERT"} RecordEventName
 */
/**
 * @typedef {"NEW_IMAGE"} RecordViewType
 */

/**
 * @typedef Record
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
