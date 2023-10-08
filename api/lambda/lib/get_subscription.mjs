import { dynamodb, table_subscriptions } from '../data/global.mjs';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

/**
 * @param {number} account_id
 * @returns {Promise<Subscription>}
 */
export default account_id => {
	const conditions = ['account_id = :account_id'];
	const condition_values = { ':account_id': account_id };

	return dynamodb.query({
		TableName: table_subscriptions,
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

		const subscription = unmarshall(res.Items.pop()).subscription;
		console.debug(subscription);
		return subscription;
	})
};
