export const domain = process.env.domain;
export const vapid_key = process.env.vapid_key;
export const vapid_private_key = process.env.vapid_private_key;

export const url = 'https://' + domain;

export default {
	client_id: process.env.client_id,
	display_name: process.env.display_name,
	domain,
	dynamodb_table_name: process.env.dynamodb_table_name,
	dynamodb_subscriptions: process.env.dynamodb_subscriptions,
	email: process.env.email,
	region: process.env.region,
	s3bucket: process.env.s3bucket,
	username: process.env.username,
	vapid_key,
	vapid_private_key,
	
	url: `https://${domain}`,
};