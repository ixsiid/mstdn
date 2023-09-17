export default {
	domain: process.env.domain,
	dynamodb_table_name: process.env.dynamodb_table_name,
	region: process.env.region,
	username: process.env.username,
	display_name: process.env.display_name,
	email: process.env.email,
	access_token: process.env.access_token,
	url: `https://${process.env.domain}`,
};