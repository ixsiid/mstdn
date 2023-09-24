import gl from './lib/gl_event_parser.mjs';

export const handler = async event => {
	console.debug(`[LAMBDA] ${event.rawPath}`);
	console.debug(JSON.stringify(event));


	const { method, path, keys, body } = gl.parse(event);

	console.debug({
		method,
		path,
		keys,
		body,
	});

	if (path === '/info') {
		const url = process.env.url + '/users/' + keys[0];
		const user = JSON.parse(process.env.users)[keys[0]];

		/**
		const users = {
			ixsiid: {
				name: 'IXSIID',
				preferredUsername: 'ixsiid',
				summary: 'It is I',
			}
		}
		process.env.users = '{"ixsiid":{"name":"IXSIID","preferredUsername":"ixsiid","summary":"It is I"}}';
		*/
		return {
			statusCode: 200,
			headers: { 'content-type': 'application/activity+json' },
			body: JSON.stringify({
				'@context': 'https://www.w3.org/ns/activitystreams',
				type: 'Person',
				id: url,
				name: user.name,
				preferredUsername: user.preferredUsername,
				summary: user.summary,
				url,
				inbox: url + '/inbox',
				outbox: url + '/outbox',
				icon: {
					type: 'Image',
					mediaType: 'image/png',
					url: process.env.url + '/avatar/icon.png',
				},
			}),
		};
	}

	// inbox: follow
	/**
	 * {
	 * 	'@context': 'https://www.w3.org/ns/activitystreams',
	 * 	id: 'https://hokano.server/ba7378ee-992f-4f22-817d-5b479abdccb5',
	 * 	type: 'Follow',
	 * 	actor: 'https://hokano.server/users/hokano_hito',
	 * 	object: 'https://watashino.server/users/watashi'
	 * }
	 */


	return {
		statusCode: 405
	};
};
