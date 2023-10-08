import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { generate_sign_preset, signed_fetch } from './lib/signed_fetch.mjs';

import {
	table_follows,
	region,
	dynamodb_endpoint,
	get_user_info,
	domain,
	private_key,
} from './lib/env.mjs';

/**
 * レコードをフォロワーに通知します
 * @param {Array<DynamoDBRecord>} records 
 * @returns {Promise<boolean>}
 */
export const notify_followers = (records) => {
	const option = { region };
	if (dynamodb_endpoint) option.endpoint = dynamodb_endpoint;
	const dynamo = new DynamoDB(option);

	let limit = 20;
	const conditions = ['account_id = :zero'];
	const condition_values = { ':zero': { N: '0' } };

	const {
		owner,
		key_id,
	} = get_user_info('ixsiid'); // ユーザーIDを特定する方法がない

	/** @type {Array<Activity>} */
	const activities = records.map(r => {
		/** @type {Status} */
		const p = unmarshall(r.dynamodb.NewImage);
		return {
			'@context': 'https://www.w3.org/ns/activitystreams',
			type: 'Create',
			id: 'https://' + domain + '/statuses/' + p.id,
			actor: owner,
			object: {
				id: 'https://' + domain + '/statuses/' + p.id,
				type: 'Note',
				attributedTo: owner,
				content: p.raw.content,
				published: new Date(p.created_at).toISOString(),
				to: ['https://www.w3.org/ns/activitystreams#Public'],
				// cc: [],
			},
			published: new Date(p.created_at).toISOString(),
			to: ['https://www.w3.org/ns/activitystreams#Public'],
			// cc: [],
		};
	});

	return dynamo.query({
		TableName: table_follows,
		Limit: limit,
		ScanIndexForward: false,
		ExpressionAttributeValues: condition_values,
		KeyConditionExpression: conditions.join(' and '),
	}).catch(err => {
		console.debug('DynamoDB error');
		console.debug(err);
		throw err;
	}).then(res => {
		/** @type {Array<Follower>} */
		const followers = res.Items.map(x => unmarshall(x));
		return followers.filter(x => x.is_valid && ['follow', 'broadcast'].includes(x.follow_type));
	}).catch(err => {
		console.debug('DynamoDB response parse error');
		console.debug(err);
		throw err;
	}).then(follower => {
		// inboxが共通する宛先は同時配信する
		const shared = follower.reduce((/** @type {Array<ActorInbox>} */ a, { actor, inbox, shared_inbox, follow_type }) => {
			const t = shared_inbox ?? inbox;
			const n = a.find(x => x.inbox === t);
			if (n) {
				if (follow_type === 'follow' && !n.actors.inclueds(actor)) n.actors.push(actor);
			} else {
				a.push({ actors: follow_type === 'follow' ? [actor] : [], inbox: t });
			}

			return a;
		}, []);
		const matrix = shared.map(({ actors, inbox }) => activities.map(_activity => {
			const activity = { ..._activity };
			activity.cc = actors;
			activity.object.cc = actors;
			return { inbox, activity };
		})).flat();

		console.debug(matrix);

		return Promise.all(matrix.map(({ inbox, activity }) =>
			signed_fetch(inbox, {
				method: 'post',
				headers: {
					'Content-Type': 'application/ld+json',
					Accept: 'application/ld+json',
				},
				body: JSON.stringify(activity),
			}, generate_sign_preset(key_id, private_key, 'mastodon'))
				.then(res => {
					console.debug(res);
					console.debug(JSON.stringify({ inbox, activity }));

					if (res.ok) return res.ok;
					throw 'Do not receive Note Activity to inbox: ';
				})
		));
	}).then(x => x.reduce((a, b) => a & b));
};
