import config from "../data/config.mjs";
const { client_id } = config;

let vapid_key = undefined;

export default event => {
	if (!vapid_key) {
		vapid_key = 'BCk-QqERU0q-CfYZjcuB6lnyyOYfJ2AifKqfeGIm7Z-HiTU5T9eTG5GxVA0_OH5mMlI4UkkDTpaZwozy0TzdZ2M=';
	}
	return {
		name: event.body.client_name,
		vapid_key,
		client_id,
		website: event.body.website ?? null,
	};
};