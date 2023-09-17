let vapid_key = undefined;

export default event => {
	const post = JSON.parse(event.body);

	if (!vapid_key) {
		vapid_key = 'BCk-QqERU0q-CfYZjcuB6lnyyOYfJ2AifKqfeGIm7Z-HiTU5T9eTG5GxVA0_OH5mMlI4UkkDTpaZwozy0TzdZ2M=';
	}
	return {
		name: post.client_name,
		vapid_key,
	};
};