const { DynamoDB } = require("@aws-sdk/client-dynamodb");
const { unmarshall } = require("@aws-sdk/util-dynamodb");
const { region, dynamodb_table_name } = require('../../data/config.js');

const to_status = require('../../lib/toStatus.js');

module.exports = async (event, args) => {
	const dynamo = new DynamoDB({ region });

	const result = await dynamo.query({
		TableName: dynamodb_table_name,
		Limit: 20,
		ScanIndexForward: false,
		ExpressionAttributeValues: { ':zero': { N: '0' }},
		KeyConditionExpression: 'account_id = :zero',
	}).catch(err => {
		console.log('DynamoDB error');
		console.log(err);
		return undefined;
	}).then(res => {
		console.log('DynamoDB response');
		console.log(res.Items[0]);
		console.log(JSON.stringify(unmarshall(res.Items[0])))
		return res.Items
		.map(x => unmarshall(x))
		.map(x => to_status({
			...(x.raw),
			id: x.id,
			created_at: new Date(x.created_at).toISOString(),
		}));
	}).catch(err => {
		console.log('DynamoDB response parse error');
		console.log(err);
		return undefined;
	});

	console.log(result);

	return result ?? { error: 'database access error' };
};
