import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

import config from '../../data/config.mjs';
const { region, vapid_key, dynamodb_subscriptions } = config;

/**
 * @param {IntegrationEvent} event
 * @param {Auth} auth
 * @returns {MethodResponse}
 */
export default async (event, auth) => {
	// JWT Authorizerに一任していいはず
	// if (auth.account_id !== 0) return { statusCode: 401 };

	const option = { region };
	if (process.env.dynamodb_endpoint) option.endpoint = process.env.dynamodb_endpoint;
	const dynamo = new DynamoDB(option);

	if (event.httpMethod === 'GET') {
		try {
			const conditions = ['account_id = :account_id'];
			const condition_values = { ':account_id': auth.account_id };

			const subscription = await dynamo.query({
				TableName: dynamodb_subscriptions,
				Limit: 1,
				ScanIndexForward: false,
				ExpressionAttributeValues: marshall(condition_values),
				KeyConditionExpression: conditions.join(' and '),
			}).catch(err => {
				throw 'DynamoDB error: ' + err;
			}).then(res => {
				console.debug('DynamoDB response');
				console.debug(res.Items[0]);
				console.debug(JSON.stringify(unmarshall(res.Items[0])))
				return unmarshall(res.Items.pop()).subscription;
			});

			console.debug(subscription);
			return {
				statusCode: 200,
				heders: { type: 'application/json' },
				body: JSON.stringify({
					id: auth.account_id,
					endpoint: subscription.endpoint,
					server_key: vapid_key,
					// アラートは設定していないためすべてtrueで返す
					alerts: {
						favourite: true,
						follow: true,
						mention: true,
						poll: true,
						reblog: true
					}
				}),
			};
		} catch (err) {
			console.error(err);
			return { statusCode: 404 };
		}
	}

	if (event.httpMethod === 'POST') {
		try {
			await dynamo.putItem({
				TableName: dynamodb_subscriptions,
				Item: marshall({
					id: 0,
					created_at: new Date().getTime(),
					account_id: auth.account_id,
					subscription: event.parsed_body.subscription,
				}),
			});

			return {
				statusCode: 200,
				headers: { type: 'application/json' },
				body: JSON.stringify({
					id: auth.account_id,
					endpoint: event.parsed_body.subscription.endpoint,
					// eventで要求されたalertsは用いない。それをストアする手段が今はない
					alerts: {
						follow: true,
						favourite: true,
						reblog: true,
						mention: true,
						poll: true,
					},
					server_key: vapid_key,
				}),
			};
		} catch (err) {
			console.error(err);
			return { statusCode: 501 };
		}
	}

	if (event.httpMethod === 'PUT') { }
	return { statusCode: 404 };
};