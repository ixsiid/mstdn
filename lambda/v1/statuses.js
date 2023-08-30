const { DynamoDB } = require("@aws-sdk/client-dynamodb");
const { region, dynamodb_table_name } = require('../data/config.js');

/**
 * 
 * @param {*} event 
 * @param {*} id 
 * @param {*} args 
 * @returns 
 */
module.exports = async (event, id, args) => {
	if (id === undefined) { // 新しい投稿
		const auth = require('../lib/auth.js');
		if (event.httpMethod === 'POST' && auth(event)) {
			const post = JSON.parse(event.body);
			const status = require('../data/status.js');
			// ダミーデータから、Dynamo DBには保存しないキーを一度削除する
			delete status.id;
			delete status.uri;
			delete status.created_at;
			delete status.account;

			status.content = post.status;
			if (post.in_reply_to_id) status.in_reply_to_id = post.in_reply_to_id;
			if (post.media_ids) status.media_attachments = post.media_ids;
			status.sensitive = post.sensitive || false;
			status.spoiler_text = post.spoiler_text || '';
			status.visibility = post.visibility || 'public';

			let id = -1;

			const dynamo = new DynamoDB({ region });
			await dynamo.scan({
				TableName: dynamodb_table_name,
				KeyConditionExpression: 'id > 0',
				ProjectionExpression: 'id',
			}).then(data => {
				console.log(data);
				id = data.Count;
			}).catch(err => {
				console.log(err);
			});
			console.log(`ID: ${id}`);

			if (id < 0) return { error: 'database access error' };
			const created_at = new Date().getTime();

			await dynamo.putItem({
				TableName: dynamodb_table_name,
				Item: {
					id: { N: '' + id },
					created_at: { N: '' + created_at },
					account_id: { N: '0' },
					raw: { S: JSON.stringify(status) },
				},
			}).then(data => {
				console.log(data);
				return data;
			}).catch(err => {
				console.log(err);
				return err;
			});

			return require('../lib/toStatus.js')({ ...status, id, created_at });
		}
	}

	return { error: 'Not permitted' };
};