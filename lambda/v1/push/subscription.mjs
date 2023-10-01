import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';

import config from '../../data/config.mjs';
const { region, vapid_key, dynamodb_subscriptions } = config;

import get_subscription from '../../lib/get_subscription.mjs';

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

	if (event.httpMethod === 'GET' || event.httpMethod === 'PUT') {
		return get_subscription(auth.account_id)
			.then(subscription => ({
				statusCode: 200,
				headers: { type: 'application/json' },
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
			})).catch(err => {
				console.error(err);
				return { statusCode: 404 };
			});
	}

	if (event.httpMethod === 'POST') {
		return dynamo.putItem({
			TableName: dynamodb_subscriptions,
			Item: marshall({
				id: 0,
				created_at: new Date().getTime(),
				account_id: auth.account_id,
				subscription: event.parsed_body.subscription,
			}),
		}).then(() => ({
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
		})).catch(err => {
			console.error(err);
			return { statusCode: 501 };
		});
	}

	return { statusCode: 404 };
};