import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';

import { parse_body } from './lib/gl_event_parser.mjs';
import {
	signed_fetch,
	generate_sign_preset
} from './lib/signed_fetch.mjs';

import { notify_followers } from './notify_followers.mjs';

import {
	public_key, private_key,
	region,
	follow_table_name,
	dynamodb_endpoint,
	get_user_info,
	domain,
} from './lib/env.mjs';

const type_ld_json = 'application/ld+json; profile="https://www.w3.org/ns/activitystreams"';
const type_act_json = 'application/activity+json';


/**
 * @param {IntegrationEvent} event 
 * @returns 
 */
export const handler = async event => {
	console.debug(`[LAMBDA] ${event.rawPath}`);
	console.debug(JSON.stringify(event));

	if ('Records' in event) {
		/** @type {Array<DynamoDBRecord>} */
		const insert_records = event.Records.filter(x => x.eventName === 'INSERT');
		const processing_result = insert_records.length === 0 ?
			false :
			notify_followers(insert_records)
				.catch(err => false);
		return processing_result;
	}

	/** @type {string} */
	const method = event.requestContext.http.method.toLowerCase();
	const path = event.routeKey.split(' ')[1].split('/').filter(x => !x.match(/\{(.*?)\}/)).join('/');
	const keys = event.pathParameters;
	const body = (['post', 'put'].includes(method) && event.body) ?
		parse_body(event.body, event.headers['content-type'], event.isBase64Encoded) :
		undefined;

	console.debug({
		method,
		path,
		keys,
		body,
	});

	// /.well-known
	if (path === '/.well-known/host-meta') {
		return {
			statusCode: 200,
			headers: { 'content-type': 'application/xrd+xml' },
			body: `<?xml version="1.0"?>
<XRD xmlns="http://docs.oasis-open.org/ns/xri/xrd-1.0">
<Link rel="lrdd" type="application/xrd+xml" template="https://${domain}/.well-known/webfinger?resource={uri}"/>
</XRD>`,
		};
	}

	if (path === '/.well-known/nodeinfo') {
		return {
			statusCode: 200,
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				links: [{
					rel: 'http://nodeinfo.diaspora.software/ns/schema/2.1',
					href: `https://${domain}/.well-known/nodeinfo`,
				}],
			}),
		};
	}

	if (path === '/.well-known/webfinger') {
		const user = 'user';
		return {
			statusCode: 200,
			headers: { 'content-type': 'application/jrd+json' },
			body: JSON.stringify({
				subject: `acct:${user}@${domain}`,
				links: [{
					rel: 'self',
					type: 'application/activity+json',
					href: `https://${domain}/users/${user}/info`,
				}],
			}),
		};
	}


	// /users


	const {
		base_url,
		owner,
		userinfo,
		key_id,
	} = get_user_info(keys.id);

	if (path === '/users/info' || path === '/users/key') {
		return {
			statusCode: 200,
			headers: { 'content-type': type_act_json },
			body: JSON.stringify({
				'@context': [
					'https://www.w3.org/ns/activitystreams',
					'https://w3id.org/security/v1',
				],
				type: 'Person',
				id: base_url + '/info',
				name: userinfo.name,
				preferredUsername: userinfo.preferredUsername,
				summary: userinfo.summary,
				url: base_url + '/info',
				inbox: base_url + '/inbox',
				outbox: base_url + '/outbox',
				icon: {
					type: 'Image',
					mediaType: 'image/png',
					url: 'https://' + domain + '/avatar/icon.png',
				},
				publicKey: {
					id: base_url + '/key',
					owner,
					publicKeyPem: public_key,
					type: 'key',
				},
			}),
		};
	}

	if (path === '/users/key') {
		return {
			statusCode: 200,
			headers: { 'content-type': type_ld_json },
			body: JSON.stringify({
				'@context': 'https://w3id.org/security/v1',
				publicKey: {
					id: base_url + '/key',
					owner,
					publicKeyPem: public_key,
					type: 'key',
				},
			}),
		};
	}


	if (path === '/users/inbox') {
		if (body.object !== owner && body.object?.object !== owner) return { statusCode: 404 };
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
		/** @type {Object<string, ActivityType} */
		const type_to_undo = {
			'Follow': 'Unfollow',
		};
		const type = undo ? type_to_undo[body.object.type] : body.type;
		if (!type) return { statusCode: 405 };

		switch (type) {
			case 'Follow':
			case 'Unfollow':
				// 本来は先に webfinger を叩く
				return fetch(body.actor, { headers: { Accept: type_ld_json } })
					.then(res => res.json())
					.then(json => {
						console.debug(JSON.stringify(json, null, 2));
						return {
							account_id: 0, // object からローカルアカウントを特定する必要がある
							actor: body.actor,
							last_modified: new Date().getTime(),
							follow_type: 'follow', // follow か follower
							is_valid: type !== 'Unfollow',
							inbox: json.inbox,
							outbox: json.outbox,
						};
					})
					.then(item => {
						return signed_fetch(item.inbox, {
							method: 'post',
							headers: {
								'Content-Type': type_ld_json,
								'Accept': type_act_json,
							},
							body: JSON.stringify({
								'@context': 'https://www.w3.org/ns/activitystreams',
								type: 'Accept',
								actor: owner,
								object: body,
							}),
						}, generate_sign_preset(key_id, private_key, 'mastodon')
						).then(res => {
							if (!res.ok) throw res.text();
						}).then(() => item)
					})
					.then(item => {
						console.debug(JSON.stringify(item, null, 2));

						/** @type {import('@aws-sdk/client-dynamodb').DynamoDBClientConfig} */
						const option = { region };
						if (dynamodb_endpoint) option.endpoint = dynamodb_endpoint;
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
