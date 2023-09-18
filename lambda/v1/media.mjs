import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import crypto from 'node:crypto';

import config from '../data/config.mjs';
const { region, s3bucket, domain } = config;
import instance from '../data/instance.mjs';

const media_types = ['image/jpeg'];

/**
 * @param {IntegratioEvent} event
 * @param {Auth} auth 
 * @param {number} id 
 * @returns {Media}
 */
export default async (event, auth, id) => {
	console.debug('start v1/media method');
	const client = new S3Client({ region });

	for (const part of event.parsed_body) {
		const type = part.header['Content-Type'];
		if (!(media_types.includes(type))) continue;
		const filename = part.header['Content-Disposition'].split('; ').find(x => x.startsWith('filename=')).substring(9).replaceAll('"', '');

		const Key = 'media/' + crypto.randomUUID();
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
			id: '1001',
			type,
			url: `${domain}/${Key}`,
			preview_url: `${domain}/${Key}`,
			description: filename,
		}
	}

	if (id === undefined) {
		return {
			id: 1001,
			type: 'unknown',
			url: `${url}/media/1001`,
			preview_url: `${url}/media/1001.thumb`,
			description: 'It is dummy response, because attachment media is not improvement.'
		};
	}

	return {
		id: 1001,
		type: 'unknown',
		url: `${url}/media/1001`,
		preview_url: `${url}/media/1001.thumb`,
		description: 'It is dummy response, because attachment media is not improvement.'
	};
};
