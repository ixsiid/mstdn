export default {
	client_id: process.env.client_id,
	display_name: process.env.display_name,
	domain: process.env.domain,
	dynamodb_table_name: process.env.dynamodb_table_name,
	email: process.env.email,
	region: process.env.region,
	s3bucket: process.env.s3bucket,
	username: process.env.username,
	vapid_key: process.env.vapid_key,
	
	url: `https://${process.env.domain}`,
};