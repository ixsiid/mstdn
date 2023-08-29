import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { region, dynamodb_table_name } from '../data/config.js';

module.exports = async (event, args) => {
	const TableName = dynamodb_table_name;
	const dynamo = DynamoDB({ region });

	const result = (await dynamo.query({
		TableName,
		Limit: 20,
		ScanIndexForward: false,
		ExpressionAttributeValues: { ':zero': 0 },
		KeyConditionExpression: 'account_id = :zero',
	}, function (err, data) {
		if (err) return undefined;
		return data;
	}).promise()).Items.map(x => {
		const status = require('../../lib/toStatus.js')({
			...(JSON.parse(x.raw)),
			id: x.id,
			created_at: x.created_at,
		});
		return status;
	});

	console.log(result);

	return result ?? { error: 'database access error' };
};
