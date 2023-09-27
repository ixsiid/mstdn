import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';

import gl from './lib/gl_event_parser.mjs';

const { public_key, private_key } = process.env;

const type_ld_json = 'application/ld+json; profile="https://www.w3.org/ns/activitystreams"';
const type_act_json = 'application/activity+json';

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

	const url = process.env.url + '/users/' + keys[0];
	const me = url + '/info';
	const user = JSON.parse(process.env.users)[keys[0]];

	if (path === '/info') {
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
			headers: { 'content-type': type_act_json },
			body: JSON.stringify({
				'@context': [
					'https://www.w3.org/ns/activitystreams',
					'https://w3id.org/security/v1',
				],
				type: 'Person',
				id: url + '/info',
				name: user.name,
				preferredUsername: user.preferredUsername,
				summary: user.summary,
				url: url + '/info',
				inbox: url + '/inbox',
				outbox: url + '/outbox',
				icon: {
					type: 'Image',
					mediaType: 'image/png',
					url: process.env.url + '/avatar/icon.png',
				},
				publicKey: {
					id: url + '/key',
					owner: me,
					publicKeyPem: public_key,
					type: 'key',
				},
			}),
		};
	}

	if (path === '/key') {
		return {
			statusCode: 200,
			headers: { 'content-type': type_ld_json },
			body: JSON.stringify({
				'@context': 'https://w3id.org/security/v1',
				publicKey: {
					id: url + '/key',
					owner: me,
					publicKeyPem: public_key,
					type: 'key',
				},
			}),
		};
	}


	if (path === '/inbox') {
		if (body.object !== me) return { statusCode: 404 }
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
				// 本来は先に webfinger を叩く
				return fetch(body.actor, { headers: { Accept: type_ld_json } })
					.then(res => res.json())
					.then(json => {
						console.debug(JSON.stringify(json, null, 2));
						return {
							account_id: 0, // object からローカルアカウントを特定する必要がある
							created_at: new Date().getTime(),
							actor: body.actor,
							type: 'follow', // follow か follower
							is_valid: type !== 'Unfollow',
							inbox: json.inbox,
							outbox: json.outbox,
						};
					})
					.then(item => {
						return fetch(item.inbox, {
							method: 'post',
							headers: {
								'content-type': type_ld_json,
								'Accept': type_act_json,
							},
							body: JSON.stringify({
								'@context': 'https://www.w3.org/ns/activitystreams',
								type: 'Accept',
								actor: me,
								object: body,
							}),
						}).then(res => {
							if (!res.ok) throw res.text();
						}).then(() => item)
					})
					.then(item => {
						console.debug(JSON.stringify(item, null, 2));
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
					.then(() => ({ statusCode: 202 }))
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
