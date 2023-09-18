import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import instance from './instance.mjs';
const { url } = instance;

/**
 * 
 * @param {IntegratioEvent} event
 * @param {Auth} auth 
 * @param {number} id 
 * @returns {Media}
 */
export default async (event, auth, id) => {
	const client = new S3Client({});

	for (const part of event.parsed_body) {
		const filename = part.header['Content-Disposition'].split('; ').find(x => x.startsWith('filename=')).substring(9).replaceAll('"', '');
		const command = new PutObjectCommand({
			Bucket: '',
			Key: filename,
			Body: part.body,
		});
		await client.send(command);
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
