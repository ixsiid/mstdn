import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';

import gl from './lib/gl_event_parser.mjs';

const type_ld_json = 'application/ld+json; profile="https://www.w3.org/ns/activitystreams"';

export const handler = async event => {
	console.debug(`[LAMBDA] ${event.rawPath}`);
	console.debug(JSON.stringify(event));


	const { method, path, keys, body } = gl.parse(event);

	/** @type {Auth} */
	const auth = (() => {
		if (!event.requestContext.authorizer) return undefined;
		const authorizer = event.requestContext.authorizer;
		if ('jwt' in authorizer) {
			return {
				username: authorizer.jwt.claims?.username,
				account_id: 0, // It's constant value for "Solo"
				scopes: ['read', 'write', 'push'], // authorizer.jwt.scopes
			};
		}
	})();

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


	if (path === '/inbox') {
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

		// table-scheme
		const undo = body.type === 'Undo';
		const type = undo ? 'a'/** ToDo dynamodb から body.idを検索してtypeを調べる */ : body.type;

		switch (type) {
			case 'Follow':
			case 'Unfollow':
			case 'FollowRequest':
				return fetch(body.id, { headers: { Accept: type_ld_json } })
					.then(res => res.json())
					.then(json => ({
						account_id: auth.account_id,
						created_at: new Date().getTime(),
						actor: body.actor,
						type: 'follow', // follow か follower
						is_valid: type !== 'Unfollow',
						inbox: json.inbox,
						outbox: json.outbox,
					}))
					.then(item => {
						const region = process.env.region;
						const follow_table_name = process.env.follows_table_name;

						const option = { region };
						if (process.env.dynamodb_endpoint) option.endpoint = process.env.dynamodb_endpoint;
						const dynamo = new DynamoDB(option);

						return dynamo.putItem({
							TableName: follow_table_name,
							Item: marshall(item),
						});
					})
					.then(() => ({ statusCode: 200 }))
					.catch(err => {
						console.error(err);
						return { statusCode: 405 };
					});
			default:
				// Not implements
				return { statusCode: 405 };
		}
	}

	return { statusCode: 405 };
}
