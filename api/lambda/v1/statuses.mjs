import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';

import config from '../data/config.mjs';
const { region, dynamodb_statuses, domain } = config;

import status_template from '../data/status.mjs';
import to_status from '../lib/to_status.mjs';
import { send_notification, NotificationTypes } from '../lib/send_notification.mjs';

/**
 * @param {IntegrationEvent}
 * @param {Auth}
 * @returns {MethodResponse}
 */
export default async (event, auth, id, args) => {
	console.debug('start statuses method');
	console.debug(event.parsed_body);

	// 認証を求める。ユーザーは0固定
	if (auth?.account_id !== 0) return { statusCode: 401 };

	if (id === undefined) { // 新しい投稿
		const method = event.requestContext.http.method;
		if (method === 'POST') {
			const post = event.parsed_body;
			const status = JSON.parse(JSON.stringify(status_template));
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
			if (post.media_ids) {
				// Media attachmentsデータはv1/media でアップロード時に作ってやらないと苦しい
				status.media_attachments = post.media_ids.map(id => ({
					id,
					type: 'image',
					url: `https://${domain}/media/${id}`,
					preview_url: `https://${domain}/media/${id}`,
					remote_url: null,
					text_url: null,
				}));
			}
			status.sensitive = post.sensitive || false;
			status.spoiler_text = post.spoiler_text || '';
			status.visibility = post.visibility || 'public';


			const option = { region };
			if (process.env.dynamodb_endpoint) option.endpoint = process.env.dynamodb_endpoint;
			const dynamo = new DynamoDB(option);


			const created_at = new Date().getTime();
			// scanで最大値をとっていたのを一旦やめる
			// getTimeは重複する可能性があるが、現状1アカウントのためほぼない。
			// 恒久対策は別途検討する
			const id = new Date().getTime();

			return dynamo.putItem({
				TableName: dynamodb_statuses,
				Item: marshall({
					id,
					created_at,
					account_id: 0,
					raw: status,
				}),
			}).then(data => {
				console.debug(data);
				return data;
			}).then(r => {
				return {
					statusCode: 200,
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify(to_status({ ...status, id, created_at })),
				};
			}).catch(err => {
				console.debug(err);
				return { statusCode: 501 };
			});
		}
	}

	return { statusCode: 500 };
};