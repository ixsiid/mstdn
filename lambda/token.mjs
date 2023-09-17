import config from "./data/config.mjs";
const { access_token } = config;

export default () => {
	return {
		access_token,
		token_type: 'Bearer',
		scope: 'read write push',
		created_at: new Date().getTime(),
	};
};