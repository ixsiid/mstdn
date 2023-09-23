import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import config from '../../data/config.mjs';
const { region, dynamodb_statuses } = config;

import to_status from '../../lib/to_status.mjs';

export default async (event, auth, args) => {
	// アクセス先がpublicの時は認証不要
	// それ以外は認証必要
	if (event.requestContext.http.path.split('/').pop() !== 'public' && !auth) {
		return { statusCode: 401 };
	}

	const option = { region };
	if (process.env.dynamodb_endpoint) option.endpoint = process.env.dynamodb_endpoint;
	const dynamo = new DynamoDB(option);

	let limit = 20;
	const conditions = ['account_id = :zero'];
	const condition_values = { ':zero': { N: '0' } };
	if (event.queryStringParameters) {
		const q = event.queryStringParameters;
		if (q.limit) limit = parseInt(q.limit);
		if (q.min_id) {
			conditions.push('id > :min_id');
			condition_values[':min_id'] = { N: '' + parseInt(q.min_id) };
		}
		if (q.max_id) {
			conditions.push('id < :max_id');
			condition_values[':max_id'] = { N: '' + parseInt(q.max_id) };
		}
		if (q.since_id) {
			conditions.push('id > :since_id');
			condition_values[':since_id'] = { N: '' + parseInt(q.since_id) };
		}
	}

	const result = await dynamo.query({
		TableName: dynamodb_statuses,
		Limit: limit,
		ScanIndexForward: false,
		ExpressionAttributeValues: condition_values,
		KeyConditionExpression: conditions.join(' and '),
	}).catch(err => {
		console.debug('DynamoDB error');
		console.debug(err);
		return undefined;
	}).then(res => {
		console.debug('DynamoDB response');
		console.debug(res.Items[0]);
		console.debug(JSON.stringify(unmarshall(res.Items[0])))
		return res.Items
			.map(x => unmarshall(x))
			.map(x => to_status({
				...(x.raw),
				id: x.id,
				created_at: new Date(x.created_at).toISOString(),
			}));
	}).catch(err => {
		console.debug('DynamoDB response parse error');
		console.debug(err);
		return undefined;
	});

	console.debug(result);

	return result ?? { statusCode: 505, error: 'database access error' };
};
