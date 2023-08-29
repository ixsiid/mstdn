import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { region, dynamodb_table_name } from '../data/config.js';

/**
 * 
 * @param {*} event 
 * @param {*} id 
 * @param {*} args 
 * @returns 
 */
module.exports = async (event, id, args) => {
	if (id === undefined) {
		const auth = require('../lib/auth.js');
		if (event.httpMethod === 'POST' && auth(event)) {
			const post = JSON.parse(event.body);
			const status = require('../data/status.js');
			status.content = post.status;
			if (post.in_reply_to_id) status.in_reply_to_id = post.in_reply_to_id;
			if (post.media_ids) status.media_attachments = post.media_ids;
			status.sensitive = post.sensitive || false;
			status.spoiler_text = post.spoiler_text || '';
			status.visibility = post.visibility || 'public';

			const TableName = dynamodb_table_name;

			let id = -1;

			const dynamo = new DynamoDB({ region });
			await dynamo.scan({
				TableName,
				KeyConditionExpression: 'id > 0',
				ProjectionExpression: 'id',
			}, function (err, data) {
				if (err) {
					console.log(err);
				} else {
					console.log(data);
					id = data.Count;
				}
			}).promise();
			console.log(`ID: ${id}`);

			if (id < 0) return { error: 'database access error' };
			const created_at = new Date().getTime();

			await dynamo.put({
				TableName,
				Item: {
					id, created_at, account_id: 0,
					raw: JSON.stringify(status),
				},
			}, function (err, data) {
				console.log(err || data);
				return err || data;
			}).promise();

			return require('../lib/toStatus.js')({ ...status, id, created_at });
		}
	}

	return { error: 'not permitted' };
};