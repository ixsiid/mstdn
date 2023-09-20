export default (body, headers, isBase64Encoded) => {
	const buffer = isBase64Encoded ? Buffer.from(body, 'base64') : undefined;
	const type = headers['content-type'].split(';')[0];
	console.debug(`type: ${type} [${buffer?.length}]`);
	switch (type) {
		case 'application/json':
			const json = JSON.parse(buffer?.toString() ?? body);
			console.debug(JSON.stringify(json, null, 2));
			return json;
		case 'application/x-www-form-urlencoded':
			const form = Object.fromEntries(
				(buffer?.toString() ?? body)
					.split('&')
					.map(x => x.split('=').map(x => decodeURIComponent(x)))
			);
			console.debug(JSON.stringify(form));
			return form;
		case 'multipart/form-data':
			const boundary = Buffer.from('\r\n--' + headers['content-type'].split('boundary=').pop());
			const buffer_parts = [];
			let i = boundary.length;
			while (true) {
				const sep = buffer.indexOf(boundary, i);
				if (sep < 0) break;
				buffer_parts.push(buffer.subarray(i, sep - i));
				i += sep + boundary.length + 2; // boudary後続の\r\n
			}

			const parts = buffer_parts.map(b => {
				const s = b.indexOf(Buffer.from('\r\n\r\n'));
				const header = Object.fromEntries(
					b.subarray(0, s)
						.toString()
						.split('\r\n')
						.map(x => x.split(': '))
				);

				const body = b.subarray(s + 4);

				return {
					header,
					body,
				};
			});
			console.debug(`${parts.map(x => `${JSON.stringify(x.header)};\nbody length: ${x.body.length}`)}`);
			return parts;
		default:
			const text = buffer?.toString() ?? body;
			console.debug(text.substring(0, 32));
			return text;
	}
};