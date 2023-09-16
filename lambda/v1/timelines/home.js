const { DynamoDB } = require("@aws-sdk/client-dynamodb");
const { unmarshall } = require("@aws-sdk/util-dynamodb");
const { region, dynamodb_table_name } = require('../../data/config.js');

const to_status = require('../../lib/toStatus.js');

module.exports = async (event, args) => {
	// publicの時は認証不要
	// それ以外は認証必要
	if (event.requestContext.http.path.split('/').pop() !== 'public') {
		if (event.requestContext.authorizer?.lambda?.user !== 0) {
			return { statusCode: 401, error: 'require authorization' };
		}
	}

	const option = { region };
	if (process.env.dynamodb_endpoint) option.endpoint = process.env.dynamodb_endpoint;
	const dynamo = new DynamoDB(option);

	const result = await dynamo.query({
		TableName: dynamodb_table_name,
		Limit: 20,
		ScanIndexForward: false,
		ExpressionAttributeValues: { ':zero': { N: '0' } },
		KeyConditionExpression: 'account_id = :zero',
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

	return result ?? { error: 'database access error' };
};
