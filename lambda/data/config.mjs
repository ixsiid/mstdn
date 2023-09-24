export const domain = process.env.domain;
export const user_pool_id = process.env.user_pool_id;
export const vapid_key = process.env.vapid_key;
export const vapid_private_key = process.env.vapid_private_key;

const client_id = process.env.client_id;

export const url = 'https://' + domain;

export default {
	display_name: process.env.display_name,
	domain,
	dynamodb_statuses: process.env.dynamodb_statuses,
	dynamodb_subscriptions: process.env.dynamodb_subscriptions,
	email: process.env.email,
	region: process.env.region,
	s3bucket: process.env.s3bucket,
	username: process.env.username,
	vapid_key,
	vapid_private_key,
	
	url: `https://${domain}`,
};