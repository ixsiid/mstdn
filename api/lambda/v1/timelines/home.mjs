import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import config from '../../data/config.mjs';
const { region, dynamodb_statuses, domain } = config;

import to_status from '../../lib/to_status.mjs';

export default async (event, auth, args) => {
	// アクセス先がpublicの時は認証不要
	// それ以外は認証必要
	const kind = event.requestContext.http.path.split('/').pop();
	if (kind !== 'public' && !auth) {
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

		let min_id, max_id;
		if (q.min_id) min_id = q.min_id;
		if (q.max_id) max_id = q.max_id;
		if (q.since_id) min_id = q.since_id; // min_idよりsince_idを優先

		if (min_id !== undefined && max_id !== undefined) {
			// DynamoDBの仕様として、大なりと小なりの2つの式で条件付けはできない
			// KeyConditionExpressions must only contain one condition per key
			conditions.push('id between :min_id and :max_id');
			condition_values[':min_id'] = { N: parseInt(min_id) + 1 + '' };
			condition_values[':max_id'] = { N: parseInt(max_id) - 1 + '' };
		} else if (max_id !== undefined) {
			conditions.push('id < :max_id');
			condition_values[':max_id'] = { N: parseInt(max_id) + '' };
		} else if (min_id !== undefined) {
			conditions.push('id > :min_id');
			condition_values[':min_id'] = { N: parseInt(min_id) + '' };
		}
	}

	return dynamo.query({
		TableName: dynamodb_statuses,
		Limit: limit,
		ScanIndexForward: false,
		ExpressionAttributeValues: condition_values,
		KeyConditionExpression: conditions.join(' and '),
	}).catch(err => {
		console.debug('DynamoDB error');
		throw err;
	}).then(res => {
		console.debug('DynamoDB response');
		console.debug('Length: ' + res.Items.length);
		return res.Items
			.map(x => unmarshall(x))
			.map(x => to_status({
				...(x.raw),
				id: x.id,
				created_at: new Date(x.created_at).toISOString(),
			}));
	}).then(result => {
		if (result.length === 0) return { statusCode: 200, headers: { type: 'application/json' }, body: '[]' };

		const max_id = result[0].id;
		const min_id = result[result.length - 1].id;

		return {
			statusCode: 200,
			headers: {
				'Content-Type': 'application/json',
				// Subway Tooterは、Linkヘッダから差分アクセスする
				'Link': [
					`<https://${domain}/api/v1/timelines/${kind}?max_id=${min_id}&only_media=false>; rel="next"`,
					`<https://${domain}/api/v1/timelines/${kind}?min_id=${max_id}&only_media=false>; rel="prev"`,
				].join(', '),
			},
			body: JSON.stringify(result)
		};
	}).catch(err => {
		console.debug('DynamoDB response parse error');
		console.debug(conditions);
		console.debug(condition_values);
		return {
			statusCode: 501,
			headers: { 'content-type': 'application/json' },
			body: err,
		};
	})
};
