const { DynamoDB } = require("@aws-sdk/client-dynamodb");
const { marshall } = require("@aws-sdk/util-dynamodb");
const { region, dynamodb_table_name } = require('../data/config.js');

/**
 * 
 * @param {*} event 
 * @param {*} id 
 * @param {*} args 
 * @returns 
 */
module.exports = async (event, id, args) => {
	// 認証を求める。ユーザーは0固定
	if (event.requestContext.authorizer?.lambda?.user !== 0) return { statusCode: 401 };

	if (id === undefined) { // 新しい投稿
		const method = event.requestContext.http.method;
		if (method === 'POST') {
			const post = JSON.parse(event.body);
			const status = require('../data/status.js');
			// ダミーデータから、Dynamo DBには保存しないキーを一度削除する
			delete status.id;
			delete status.uri;
			delete status.created_at;
			delete status.account;

			// 本文(string)まはた添付メディア(media_ids)のいずれかが必要
			// pollは非対応
			if (typeof (post.status) !== 'string') {
				if (!(post.media_ids instanceof Array)) return { statusCode: 422 };
				const media_ids = post.media_ids.filter(x => typeof (x) === 'string');
				if (media_ids.length === 0) return { statusCode: 422 };
			}

			// 不要なキーは削除する
			const valid_keys = [
				'status', 'media_ids', 'poll',
				'in_reply_to_id', 'sensitive', 'spoiler_text',
				'visibility', 'language', 'scheduled_at'
			];
			Object.keys(x => {
				if (!(valid_keys.includes(x))) delete post[x];
			});

			status.content = post.status;
			if (post.in_reply_to_id) status.in_reply_to_id = post.in_reply_to_id;
			if (post.media_ids) status.media_attachments = post.media_ids;
			status.sensitive = post.sensitive || false;
			status.spoiler_text = post.spoiler_text || '';
			status.visibility = post.visibility || 'public';

			let id = -1;

			const option = { region };
			if (process.env.dynamodb_endpoint) option.endpoint = process.env.dynamodb_endpoint;
			const dynamo = new DynamoDB(option);
			await dynamo.scan({
				TableName: dynamodb_table_name,
				KeyConditionExpression: 'id > 0',
				ProjectionExpression: 'id',
			}).then(data => {
				console.debug(data);
				id = data.Count;
			}).catch(err => {
				console.debug(err);
			});
			console.debug(`ID: ${id}`);

			if (id < 0) return { error: 'database access error' };
			const created_at = new Date().getTime();

			await dynamo.putItem({
				TableName: dynamodb_table_name,
				Item: marshall({
					id,
					created_at,
					account_id: 0,
					raw: status,
				}),
			}).then(data => {
				console.debug(data);
				return data;
			}).catch(err => {
				console.debug(err);
				return err;
			});

			return require('../lib/toStatus.js')({ ...status, id, created_at });
		}
	}

	return { statusCode: 500 };
};