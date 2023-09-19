import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import crypto from 'node:crypto';

import config from '../data/config.mjs';
const { region, s3bucket, domain } = config;

const media_types = ['image', 'audio', 'video'];

/**
 * @param {IntegratioEvent} event
 * @param {Auth} auth 
 * @param {number} id 
 * @returns {Media}
 */
export default async (event, auth, id) => {
	console.debug('start v1/media method');
	const client = new S3Client({ region });

	if (!auth?.account_id) {
		return { statusCode: 401 };
	}

	const method = event.requestContext.http.method;
	if (method === 'PUT' && id !== undefined) {
		return { statusCode: 501 };
	}

	for (const part of event.parsed_body) {
		const type = part.header['Content-Type'];
		if (!(media_types.includes(type.split('/')[0]))) continue;
		const filename = part.header['Content-Disposition'].split('; ').find(x => x.startsWith('filename=')).substring(9).replaceAll('"', '');

		const uuid = crypto.randomUUID()
		const Key = 'media/' + uuid;
		const command = new PutObjectCommand({
			Bucket: s3bucket,
			Key,
			Body: part.body,
			ContentType: type,
		});
		const res = await client.send(command);

		console.debug(res);

		// 1つだけ処理する
		return {
			statusCode: 200,
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				id: uuid,
				type,
				url: `https://${domain}/${Key}`,
				preview_url: `https://${domain}/${Key}`,
				description: filename,
			}),
		};
	}

	return {
		statusCode: 501,
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ error: 'There is no acceptable media.' }),
	}
};
