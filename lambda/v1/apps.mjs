import config from "../data/config.mjs";
const { client_id } = config;

let vapid_key = undefined;

export default event => {
	// アプリ固有にClient ID / Secretを作らずに既に作ってある単一のものを利用する
	return {
		name: event.body.client_name,
		client_id,
		website: event.body.website ?? null,
		client_secret: 'dummy',
	};
};