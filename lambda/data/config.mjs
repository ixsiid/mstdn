export default {
	domain: process.env.domain,
	dynamodb_table_name: process.env.dynamodb_table_name,
	region: process.env.region,
	username: process.env.username,
	display_name: process.env.display_name,
	email: process.env.email,
	url: `https://${process.env.domain}`,
	client_id: process.env.client_id,
	s3bucket: process.env.s3bucket,
};