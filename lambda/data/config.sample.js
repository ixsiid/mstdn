const domain = 'your.domain.com';
module.exports = {
	domain: domain,
	dynamodb_table_name: 'statuses.' + domain,
	region: 'Your AWS Dynamo DB region',
	username: 'your name',
	display_name: 'your display name',
	email: 'your@email.address',
	access_token: 'access_token_string',
	oauth_token: {
		id: 'idididididididid',
		client_id: 'client_idclient_idclient_idclient_id',
		client_secret: 'client_secretclient_secretclient_secretclient_secretclient_secret',
	},
};
