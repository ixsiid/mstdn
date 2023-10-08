import { dynamodb, table_statuses } from '../../data/global.mjs';
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

import to_status from "../../lib/to_status.mjs";
import { NotificationTypes, send_notification } from "../../lib/send_notification.mjs";

/**
 * 
 * @param {IntegrationEvent} event
 * @param {Auth} auth
 * @returns {MethodResponse}
 */
export default (event, auth, id) => {
	const conditions = ['account_id = :zero', 'id = :id'];
	const condition_values = { ':zero': 0, ':id': parseInt(id) };

	return dynamodb.query({
		TableName: table_statuses,
		Limit: 1,
		ScanIndexForward: false,
		ExpressionAttributeValues: marshall(condition_values),
		KeyConditionExpression: conditions.join(' and '),
	}).catch(err => {
		console.error('DynamoDB query error');
		console.error(err);
		return {
			statusCode: 501,
			headers: { type: 'application/json' },
			body: JSON.stringify({ error: 'DynamoDB query error' })
		};
	}).then(res => {
		return res.Items
			.filter((_, i) => i === 0)
			.map(x => unmarshall(x))
			.map(x => to_status({
				...(x.raw),
				id: x.id,
				created_at: new Date(x.created_at).toISOString(),
			}))[0];
	}).then(body => {
		// 動作確認用に、ポストしたらFavo通知を出す
		return send_notification(body.account.id,
			NotificationTypes.FAVOURITE,
			'ファボされました。' + (body.spoiler_text || body.content))
			.then(() => body);
	}).then(body => {
		return {
			statusCode: 200,
			headers: { type: 'application/json' },
			body: JSON.stringify({
				...body,
				favourited: true,
			}),
		};
	}).catch(err => {
		console.error('DynamoDB response parse error');
		console.error(err);
		return {
			statusCode: 501,
			headers: { type: 'application/json' },
			body: JSON.stringify({ error: 'DynamoDB response parse error' })
		};
	});
};
